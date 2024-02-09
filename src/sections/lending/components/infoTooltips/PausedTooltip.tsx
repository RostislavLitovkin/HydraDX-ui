import { ExclamationIcon } from "@heroicons/react/outline"

import { Stack, SvgIcon, Tooltip } from "@mui/material"

import { PopperComponent } from "sections/lending/components/ContentWithTooltip"

export const PausedTooltipText = () => {
  return (
    <span>
      This asset has been paused due to a community decision. Supply, withdraw,
      borrows and repays are impacted.
    </span>
  )
}

export const PausedTooltip = () => {
  return (
    <Tooltip
      arrow
      placement="top"
      PopperComponent={PopperComponent}
      title={
        <Stack sx={{ py: 4, px: 6 }} spacing={1}>
          <PausedTooltipText />
        </Stack>
      }
    >
      <SvgIcon sx={{ fontSize: "20px", color: "error.main", ml: 8 }}>
        <ExclamationIcon />
      </SvgIcon>
    </Tooltip>
  )
}