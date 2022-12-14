import { Modal } from "components/Modal/Modal"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Controller, useForm } from "react-hook-form"
import BigNumber from "bignumber.js"
import { WalletTransferAssetSelect } from "sections/wallet/transfer/WalletTransferAssetSelect"
import { Text } from "components/Typography/Text/Text"
import { Separator } from "components/Separator/Separator"
import { Button } from "components/Button/Button"
import { useApiPromise } from "utils/api"
import { OmnipoolPool } from "sections/pools/PoolsPage.utils"
import { BN_10 } from "utils/constants"
import { useStore } from "state/store"
import { u32 } from "@polkadot/types"
import { FormValues } from "utils/helpers"
import { useAddLiquidity } from "./AddLiquidity.utils"

type AddLiquidityProps = {
  isOpen: boolean
  onClose: () => void
  pool: OmnipoolPool
  onSuccess: () => void
}

export const AddLiquidity = ({
  isOpen,
  onClose,
  pool,
  onSuccess,
}: AddLiquidityProps) => {
  const [assetId, setAssetId] = useState<u32 | string>(pool?.id.toString())
  const [assetValue, setAssetValue] = useState("")

  const { calculatedShares, spotPrice, omnipoolFee, assetMeta, assetBalance } =
    useAddLiquidity(assetId, assetValue)

  const api = useApiPromise()
  const { createTransaction } = useStore()
  const { t } = useTranslation()
  const form = useForm<{
    amount: string
  }>({})

  const onSubmit = async (values: FormValues<typeof form>) => {
    if (assetMeta?.decimals == null) throw new Error("Missing asset meta")

    const amount = new BigNumber(values.amount)
      .multipliedBy(BN_10.pow(assetMeta.decimals.toNumber()))
      .toString()

    return await createTransaction(
      {
        tx: api.tx.omnipool.addLiquidity(assetId, amount),
      },
      { onSuccess },
    )
  }

  return (
    <Modal
      open={isOpen}
      title={t("pools.addLiquidity.modal.title")}
      onClose={() => {
        onClose()
        form.reset()
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        sx={{
          flex: "column",
          justify: "space-between",
          height: "100%",
          mt: 10,
        }}
      >
        <div sx={{ flex: "column" }}>
          <Controller
            name="amount"
            control={form.control}
            rules={{
              required: t("wallet.assets.transfer.error.amount.required"),
              validate: {
                validNumber: (value) => {
                  try {
                    if (!new BigNumber(value).isNaN()) return true
                  } catch {}
                  return t("error.validNumber")
                },
                positive: (value) =>
                  new BigNumber(value).gt(0) || t("error.positive"),
                maxBalance: (value) => {
                  try {
                    if (assetMeta?.decimals == null)
                      throw new Error("Missing asset meta")
                    if (
                      assetBalance?.balance.gte(
                        BigNumber(value).multipliedBy(
                          BN_10.pow(assetMeta?.decimals.toNumber()),
                        ),
                      )
                    )
                      return true
                  } catch {}
                  return t(
                    "pools.addLiquidity.modal.validation.notEnoughBalance",
                  )
                },
              },
            }}
            render={({
              field: { name, value, onChange },
              fieldState: { error },
            }) => (
              <WalletTransferAssetSelect
                title={t("wallet.assets.transfer.asset.label_mob")}
                name={name}
                value={value}
                onBlur={setAssetValue}
                onChange={onChange}
                asset={assetId}
                onAssetChange={setAssetId}
                error={error?.message}
              />
            )}
          />
          <div
            sx={{
              flex: "row",
              justify: "space-between",
              align: "center",
              mt: 20,
              mb: 37,
            }}
          >
            <Text color="basic300" fs={14}>
              {t("pools.pool.liquidity.poolFees")}
            </Text>
            <Text fs={14} color="white">
              {t("value.percentage", { value: omnipoolFee?.fee })}
            </Text>
          </div>

          <Text color="pink500" fs={15} font="FontOver" tTransform="uppercase">
            {t("pools.addLiquidity.modal.positionDetails")}
          </Text>

          <div
            sx={{
              flex: "row",
              justify: "space-between",
              align: "center",
              mt: 9,
              mb: 4,
            }}
          >
            <Text color="darkBlue300" fs={14}>
              {t("pools.removeLiquidity.modal.price")}
            </Text>
            <Text fs={14} color="white">
              {t("pools.addLiquidity.modal.row.spotPrice", {
                firstAmount: 1,
                firstCurrency: assetMeta?.symbol,
                secondAmount: spotPrice?.spotPrice,
              })}
            </Text>
          </div>
          <Separator color="darkBlue401" />
          <div
            sx={{
              flex: "row",
              justify: "space-between",
              align: "center",
              mt: 8,
              mb: 4,
            }}
          >
            <Text color="darkBlue300" fs={14}>
              {t("pools.addLiquidity.modal.receive")}
            </Text>
            <Text fs={14} color="white">
              {t("value", {
                value: calculatedShares,
                fixedPointScale: assetMeta?.decimals.toString(),
                type: "token",
              })}
            </Text>
          </div>
          <Separator color="darkBlue401" />
          <Text
            color="warningOrange200"
            fs={14}
            fw={400}
            sx={{ mt: 17, mb: 24 }}
          >
            {t("pools.addLiquidity.modal.warning")}
          </Text>
          <Separator
            color="darkBlue401"
            sx={{ mx: "-30px", mb: 20, width: "auto" }}
          />
        </div>
        <Button variant="primary" type="submit">
          {t("pools.addLiquidity.modal.confirmButton")}
        </Button>
      </form>
    </Modal>
  )
}
