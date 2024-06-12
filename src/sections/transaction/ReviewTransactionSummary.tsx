import { SubmittableExtrinsic } from "@polkadot/api/types"
import { Summary } from "components/Summary/Summary"
import { Text } from "components/Typography/Text/Text"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import Skeleton from "react-loading-skeleton"
import { useTransactionValues } from "./ReviewTransactionForm.utils"
import BN from "bignumber.js"
import { ReviewReferralCodeWrapper } from "sections/referrals/components/ReviewReferralCode/ReviewReferralCodeWrapper"
import { useRegistrationLinkFee } from "api/referrals"
import { useRpcProvider } from "providers/rpcProvider"
import { ReviewTransactionAuthorTip } from "sections/transaction/ReviewTransactionAuthorTip"
import { NATIVE_EVM_ASSET_SYMBOL } from "utils/evm"
import { Transaction } from "state/store"

type ReviewTransactionSummaryProps = {
  tx: SubmittableExtrinsic<"promise">
  transactionValues: ReturnType<typeof useTransactionValues>
  editFeePaymentAssetEnabled: boolean
  xcallMeta?: Record<string, string>
  openEditFeePaymentAssetModal: () => void
  onTipChange?: (amount: BN) => void
  referralCode?: string
}

export const ReviewTransactionSummary: FC<ReviewTransactionSummaryProps> = ({
  tx,
  transactionValues,
  xcallMeta,
  editFeePaymentAssetEnabled,
  openEditFeePaymentAssetModal,
  onTipChange,
  referralCode,
}) => {
  const { t } = useTranslation()
  const {
    displayFeePaymentValue,
    feePaymentValue,
    feePaymentMeta,
    era,
    nonce,
    isNewReferralLink,
    displayEvmFeePaymentValue,
    displayFeeExtra,
  } = transactionValues.data || {}

  return (
    <div>
      {!!xcallMeta ? (
        <ReviewTransactionXCallSummary xcallMeta={xcallMeta} />
      ) : (
        <Summary
          rows={[
            ...(isNewReferralLink
              ? [
                  {
                    label: "Link creation fee:",
                    content: <ReferralsLinkFee />,
                  },
                ]
              : []),

            {
              label: t("liquidity.reviewTransaction.modal.detail.cost"),
              content: !transactionValues.isLoading ? (
                <div sx={{ flex: "row", gap: 6, align: "baseline" }}>
                  <div sx={{ flex: "row", gap: 4 }}>
                    {displayEvmFeePaymentValue ? (
                      <Text fs={14}>
                        {t("liquidity.add.modal.row.transactionCostValue", {
                          amount: displayEvmFeePaymentValue,
                          symbol: NATIVE_EVM_ASSET_SYMBOL,
                          type: "token",
                        })}
                      </Text>
                    ) : (
                      <Text fs={14}>
                        {t("liquidity.add.modal.row.transactionCostValue", {
                          amount: displayFeePaymentValue,
                          symbol: feePaymentMeta?.symbol,
                          type: "token",
                        })}
                      </Text>
                    )}
                    {displayFeeExtra && (
                      <Text fs={14} color="brightBlue300" tAlign="right">
                        {t("value.tokenWithSymbol", {
                          value: displayFeeExtra,
                          symbol: feePaymentMeta?.symbol,
                          numberPrefix: "+  ",
                        })}
                      </Text>
                    )}
                  </div>
                  {editFeePaymentAssetEnabled && (
                    <div
                      tabIndex={0}
                      role="button"
                      onClick={openEditFeePaymentAssetModal}
                      css={{ cursor: "pointer" }}
                    >
                      <Text lh={14} color="brightBlue300">
                        {t("liquidity.reviewTransaction.modal.edit")}
                      </Text>
                    </div>
                  )}
                </div>
              ) : (
                <Skeleton width={100} height={16} />
              ),
            },
          ]}
        />
      )}
      <Summary
        rows={[
          {
            label: t("liquidity.reviewTransaction.modal.detail.lifetime"),
            content: tx.era.isMortalEra
              ? t("transaction.mortal.expire", {
                  date: era?.deathDate,
                })
              : t("transaction.immortal.expire"),
          },
          {
            label: t("liquidity.reviewTransaction.modal.detail.nonce"),
            content: nonce?.toString(),
          },
          ...(!!onTipChange
            ? [
                {
                  label: t("liquidity.reviewTransaction.modal.detail.tip"),
                  content: (
                    <ReviewTransactionAuthorTip
                      onChange={onTipChange}
                      feePaymentValue={feePaymentValue}
                      feePaymentAssetId={feePaymentMeta?.id}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
      {referralCode && (
        <ReviewReferralCodeWrapper referralCode={referralCode} />
      )}
    </div>
  )
}

export const ReviewTransactionXCallSummary: FC<
  Pick<Transaction, "xcallMeta" | "xcall">
> = ({ xcallMeta, xcall }) => {
  const { t } = useTranslation()

  if (!xcallMeta) return null

  return (
    <Summary
      rows={[
        ...(xcall?.value
          ? [
              {
                label: t("liquidity.reviewTransaction.modal.detail.amount"),
                content: t("value.tokenWithSymbol", {
                  value: new BN(xcall.value.toString()).shiftedBy(-18),
                  symbol: xcallMeta?.srcChainFeeSymbol,
                }),
              },
            ]
          : []),
        {
          label: t("liquidity.reviewTransaction.modal.detail.srcChainFee"),
          content:
            parseFloat(xcallMeta?.srcChainFee) > 0
              ? t("liquidity.add.modal.row.transactionCostValue", {
                  type: "token",
                  amount: new BN(xcallMeta.srcChainFee),
                  symbol: xcallMeta?.srcChainFeeSymbol,
                })
              : "-",
        },
      ]}
    />
  )
}

const ReferralsLinkFee = () => {
  const { t } = useTranslation()
  const { assets } = useRpcProvider()
  const registrationFee = useRegistrationLinkFee()

  return !registrationFee.isLoading ? (
    <div sx={{ flex: "row", gap: 6, align: "center" }}>
      <Text fs={14} color="brightBlue300">
        {t("value.tokenWithSymbol", {
          value: registrationFee.data?.amount,
          symbol: registrationFee.data
            ? assets.getAsset(registrationFee.data.id).symbol
            : "",
        })}
      </Text>
    </div>
  ) : (
    <Skeleton width={100} height={16} />
  )
}
