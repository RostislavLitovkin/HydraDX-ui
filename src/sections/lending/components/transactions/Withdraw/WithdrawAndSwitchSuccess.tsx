import { ArrowRightIcon } from "@heroicons/react/outline"

import { Box, SvgIcon, Typography } from "@mui/material"
import { FormattedNumber } from "sections/lending/components/primitives/FormattedNumber"
import { TokenIcon } from "sections/lending/components/primitives/TokenIcon"

import { BaseSuccessView } from "sections/lending/components/transactions/FlowCommons/BaseSuccess"

export type WithdrawAndSwitchTxSuccessViewProps = {
  txHash?: string
  amount?: string
  symbol: string
  outAmount?: string
  outSymbol: string
}

export const WithdrawAndSwitchTxSuccessView = ({
  txHash,
  amount,
  symbol,
  outAmount,
  outSymbol,
}: WithdrawAndSwitchTxSuccessViewProps) => {
  return (
    <BaseSuccessView txHash={txHash}>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Typography>
          <span>You&apos;ve successfully withdrew & switched tokens.</span>
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mt: 3,
          }}
        >
          <TokenIcon sx={{ fontSize: "20px" }} symbol={symbol} />
          <FormattedNumber value={Number(amount)} compact variant="main14" />
          <Typography variant="secondary14">{symbol}</Typography>
          <SvgIcon sx={{ fontSize: "14px" }}>
            <ArrowRightIcon fontSize="14px" />
          </SvgIcon>
          <TokenIcon sx={{ fontSize: "20px" }} symbol={outSymbol} />
          <FormattedNumber value={Number(outAmount)} variant="main14" />
          <Typography variant="secondary14">{outSymbol}</Typography>
        </Box>
      </Box>
    </BaseSuccessView>
  )
}