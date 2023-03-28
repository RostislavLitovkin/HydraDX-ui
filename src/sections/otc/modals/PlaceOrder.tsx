import { u32 } from "@polkadot/types"
import BigNumber from "bignumber.js"
import { useAssetMeta } from "api/assetMeta"
import { useAccountCurrency } from "api/payments"
import { usePaymentInfo } from "api/transaction"
import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Text } from "components/Typography/Text/Text"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { useApiPromise } from "utils/api"
import { BN_10 } from "utils/constants"
import { FormValues } from "utils/helpers"
import { useAccountStore, useStore } from "../../../state/store"
import { OrderAssetSelect } from "./cmp/AssetSelect"
import { OrderAssetRate } from "./cmp/AssetXRate"
import { PartialOrderToggle } from "./cmp/PartialOrderToggle"

import { Separator } from "components/Separator/Separator"
import { useAssetsModal } from "sections/assets/AssetsModal.utils"
import { useTokenBalance } from "api/balances"

type PlaceOrderProps = {
  assetOut?: u32 | string
  assetIn?: u32 | string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const PlaceOrder = ({
  isOpen,
  assetOut,
  assetIn,
  onClose,
  onSuccess,
}: PlaceOrderProps) => {
  const { t } = useTranslation()
  const { account } = useAccountStore()

  const [aOut, setAOut] = useState(assetOut)
  const [aIn, setAIn] = useState(assetIn)

  const form = useForm<{
    amountOut: string
    amountIn: string
    price: string
    partiallyFillable: boolean
  }>({
    defaultValues: { partiallyFillable: false },
  })

  useEffect(() => {
    form.trigger()
  }, [form])

  const api = useApiPromise()
  const assetOutMeta = useAssetMeta(aOut)
  const assetOutBalance = useTokenBalance(aOut, account?.address)
  const assetInMeta = useAssetMeta(aIn)
  const assetInBalance = useTokenBalance(aIn, account?.address)

  const accountCurrency = useAccountCurrency(account?.address)
  const accountCurrencyMeta = useAssetMeta(accountCurrency.data)
  const { createTransaction } = useStore()

  const { data: paymentInfoData } = usePaymentInfo(
    api.tx.otc.placeOrder(0, 2, "0", "0", false),
  )

  const assetOutModal = useAssetsModal({
    onSelect: (asset) => setAOut(asset.id),
  })

  const assetInModal = useAssetsModal({
    onSelect: (asset) => setAIn(asset.id),
    allAssets: true,
  })

  const handleAssetChange = () => {
    const { amountOut, amountIn } = form.getValues()
    if (amountIn && amountOut) {
      const price = new BigNumber(amountIn).div(new BigNumber(amountOut))
      form.setValue("price", price.toFixed())
    }
    form.trigger()
  }

  const handlePriceChange = () => {
    const { amountOut, price } = form.getValues()
    if (amountOut && price) {
      const amountIn = new BigNumber(amountOut).multipliedBy(
        new BigNumber(price),
      )
      form.setValue("amountIn", amountIn.toFixed())
    }
  }

  const handleSubmit = async (values: FormValues<typeof form>) => {
    if (!aIn || !aOut) {
      throw new Error("Trade pair not specified")
    }

    if (assetOutMeta.data?.decimals == null)
      throw new Error("Missing assetOut meta")

    if (assetInMeta.data?.decimals == null)
      throw new Error("Missing assetIn meta")

    const amountOutBN = new BigNumber(values.amountOut).multipliedBy(
      BN_10.pow(assetOutMeta.data?.decimals.toString()),
    )

    const amountInBN = new BigNumber(values.amountIn).multipliedBy(
      BN_10.pow(assetInMeta.data?.decimals.toString()),
    )

    await createTransaction(
      {
        tx: api.tx.otc.placeOrder(
          aIn,
          aOut,
          amountInBN.toFixed(),
          amountOutBN.toFixed(),
          values.partiallyFillable,
        ),
      },
      {
        onSuccess,
        onSubmitted: () => {
          onClose()
          form.reset()
        },
        toast: {
          onLoading: (
            <Trans
              t={t}
              i18nKey="otc.order.place.toast.onLoading"
              tOptions={{}}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
          onSuccess: (
            <Trans
              t={t}
              i18nKey="otc.order.place.toast.onSuccess"
              tOptions={{}}
            >
              <span />
              <span className="highlight" />
            </Trans>
          ),
        },
      },
    )
  }

  return (
    <>
      {assetOutModal.isOpen && (
        <Modal open={true} onClose={onClose}>
          {assetOutModal.modal}
        </Modal>
      )}
      {assetInModal.isOpen && (
        <Modal open={true} onClose={onClose}>
          {assetInModal.modal}
        </Modal>
      )}
      <Modal
        open={isOpen}
        withoutOutsideClose
        title={t("otc.order.place.title")}
        onClose={() => {
          onClose()
          form.reset()
        }}
      >
        <Text fs={16} color="basic400" sx={{ mt: 10, mb: 22 }}>
          {t("otc.order.place.desc")}
        </Text>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          autoComplete="off"
          sx={{
            flex: "column",
            justify: "space-between",
          }}
        >
          <Controller
            name="amountOut"
            control={form.control}
            rules={{
              required: true,
              validate: {
                maxBalance: (value) => {
                  const balance = assetOutBalance.data?.balance
                  const decimals = assetOutMeta.data?.decimals.toString()
                  if (
                    balance &&
                    decimals &&
                    balance.gte(
                      new BigNumber(value).multipliedBy(BN_10.pow(decimals)),
                    )
                  ) {
                    return true
                  }
                  return t("otc.order.place.validation.notEnoughBalance")
                },
              },
            }}
            render={({
              field: { name, value, onChange },
              fieldState: { error },
            }) => (
              <OrderAssetSelect
                title={t("otc.order.place.offerTitle")}
                name={name}
                value={value}
                onChange={(e) => {
                  onChange(e)
                  handleAssetChange()
                }}
                onOpen={assetOutModal.openModal}
                asset={aOut}
                balance={assetOutBalance.data?.balance}
                error={error?.message}
              />
            )}
          />
          <div sx={{ pt: 10, pb: 10 }}>
            {assetOutMeta.data && assetInMeta.data && (
              <Controller
                name="price"
                control={form.control}
                render={({ field: { value, onChange } }) => (
                  <OrderAssetRate
                    inputAsset={assetOutMeta.data?.id}
                    outputAsset={assetInMeta.data?.id}
                    price={value!}
                    onChange={(e) => {
                      onChange(e)
                      handlePriceChange()
                    }}
                  />
                )}
              />
            )}
          </div>

          <Controller
            name="amountIn"
            control={form.control}
            rules={{
              required: true,
            }}
            render={({
              field: { name, value, onChange },
              fieldState: { error },
            }) => (
              <OrderAssetSelect
                title={t("otc.order.place.getTitle")}
                name={name}
                value={value}
                onChange={(e) => {
                  onChange(e)
                  handleAssetChange()
                }}
                onOpen={assetInModal.openModal}
                asset={aIn}
                balance={assetInBalance.data?.balance}
                error={error?.message}
              />
            )}
          />

          <div
            sx={{
              mt: 10,
              mb: 10,
              flex: "row",
              justify: "space-between",
              align: "center",
            }}
          >
            <div>
              <Text fs={13} color="white">
                {t("otc.order.place.partial")}
              </Text>
              <Text fs={13} color="darkBlue300">
                {t("otc.order.place.partialDesc")}
              </Text>
            </div>

            <Controller
              name="partiallyFillable"
              control={form.control}
              render={({ field: { value, onChange } }) => (
                <PartialOrderToggle
                  partial={value}
                  onChange={(e) => onChange(e)}
                />
              )}
            />
          </div>
          <Separator color="darkBlue401" />
          <div
            sx={{
              mt: 14,
              flex: "row",
              justify: "space-between",
            }}
          >
            <Text fs={13} color="darkBlue300">
              {t("otc.order.place.fee")}
            </Text>
            <div sx={{ flex: "row", align: "center", gap: 4 }}>
              {paymentInfoData?.partialFee != null && (
                <Text fs={14}>
                  {t("otc.order.place.feeValue", {
                    amount: new BigNumber(paymentInfoData.partialFee.toHex()),
                    symbol: accountCurrencyMeta.data?.symbol,
                    fixedPointScale: accountCurrencyMeta.data?.decimals,
                  })}
                </Text>
              )}
            </div>
          </div>
          <Button
            sx={{ mt: 20 }}
            variant="primary"
            disabled={!form.formState.isValid}
          >
            {t("otc.order.place.confirm")}
          </Button>
        </form>
      </Modal>
    </>
  )
}