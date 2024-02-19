import { API_ETH_MOCK_ADDRESS } from "@aave/contract-helpers"

import { Box, Switch, Typography, useMediaQuery, useTheme } from "@mui/material"
import { useState } from "react"
import { ListWrapper } from "sections/lending/components/lists/ListWrapper"
import { NoSearchResults } from "sections/lending/components/NoSearchResults"
import { Link } from "sections/lending/components/primitives/Link"
import { Warning } from "sections/lending/components/primitives/Warning"
import { TitleWithSearchBar } from "sections/lending/components/TitleWithSearchBar"
import { MarketWarning } from "sections/lending/components/transactions/Warnings/MarketWarning"
import { useAppDataContext } from "sections/lending/hooks/app-data-provider/useAppDataProvider"
import { useProtocolDataContext } from "sections/lending/hooks/useProtocolDataContext"
import MarketAssetsList from "sections/lending/modules/markets/MarketAssetsList"
import { fetchIconSymbolAndName } from "sections/lending/ui-config/reservePatches"
import {
  getGhoReserve,
  GHO_SUPPORTED_MARKETS,
  GHO_SYMBOL,
} from "sections/lending/utils/ghoUtilities"

import { GhoBanner } from "./Gho/GhoBanner"

export const MarketAssetsListContainer = () => {
  const { reserves, loading } = useAppDataContext()
  const { currentMarket, currentMarketData, currentNetworkConfig } =
    useProtocolDataContext()
  const [searchTerm, setSearchTerm] = useState("")
  const { breakpoints } = useTheme()
  const sm = useMediaQuery(breakpoints.down("sm"))

  const ghoReserve = getGhoReserve(reserves)
  const filteredData = reserves
    // Filter out any non-active reserves
    .filter((res) => res.isActive)
    // Filter out all GHO, as we deliberately display it on supported markets
    .filter((res) => res !== ghoReserve)
    // filter out any that don't meet search term criteria
    .filter((res) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase().trim()
      return (
        res.symbol.toLowerCase().includes(term) ||
        res.name.toLowerCase().includes(term) ||
        res.underlyingAsset.toLowerCase().includes(term)
      )
    })
    // Transform the object for list to consume it
    .map((reserve) => ({
      ...reserve,
      ...(reserve.isWrappedBaseAsset
        ? fetchIconSymbolAndName({
            symbol: currentNetworkConfig.baseAssetSymbol,
            underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
          })
        : {}),
    }))
  const marketFrozen = !reserves.some((reserve) => !reserve.isFrozen)
  const showFrozenMarketWarning =
    marketFrozen &&
    ["Harmony", "Fantom", "Ethereum AMM"].includes(
      currentMarketData.marketTitle,
    )
  const unfrozenReserves = filteredData.filter(
    (r) => !r.isFrozen && !r.isPaused,
  )
  const [showFrozenMarketsToggle, setShowFrozenMarketsToggle] = useState(false)

  const handleChange = () => {
    setShowFrozenMarketsToggle((prevState) => !prevState)
  }

  const frozenOrPausedReserves = filteredData.filter(
    (r) => r.isFrozen || r.isPaused,
  )

  // Determine if to show GHO market list item
  const shouldDisplayGho = (
    marketTitle: string,
    searchTerm: string,
  ): boolean => {
    if (!GHO_SUPPORTED_MARKETS.includes(marketTitle)) {
      return false
    }

    if (!searchTerm) {
      return true
    }

    const normalizedSearchTerm = searchTerm.toLowerCase().trim()
    return (
      normalizedSearchTerm.length <= 3 &&
      GHO_SYMBOL.toLowerCase().includes(normalizedSearchTerm)
    )
  }
  const displayGho: boolean = shouldDisplayGho(currentMarket, searchTerm)

  return (
    <ListWrapper
      titleComponent={
        <TitleWithSearchBar
          onSearchTermChange={setSearchTerm}
          title={
            <>
              {currentMarketData.marketTitle} <span>assets</span>
            </>
          }
          searchPlaceholder={
            sm ? "Search asset" : "Search asset name, symbol, or address"
          }
        />
      }
    >
      {showFrozenMarketWarning && (
        <Box mx={6}>
          <MarketWarning marketName={currentMarketData.marketTitle} forum />
        </Box>
      )}

      {displayGho && (
        <Box mb={4}>
          <GhoBanner reserve={ghoReserve} />
        </Box>
      )}

      {/* Unfrozen assets list */}
      <MarketAssetsList reserves={unfrozenReserves} loading={loading} />

      {/* Frozen or paused assets list */}
      {frozenOrPausedReserves.length > 0 && (
        <Box sx={{ mt: 10, px: { xs: 4, xsm: 6 } }}>
          <Typography variant="h4" mb={4}>
            <span>Show Frozen or paused assets</span>

            <Switch
              checked={showFrozenMarketsToggle}
              onChange={handleChange}
              inputProps={{ "aria-label": "controlled" }}
            />
          </Typography>
          {showFrozenMarketsToggle && (
            <Warning variant="info">
              <span>
                These assets are temporarily frozen or paused by Aave community
                decisions, meaning that further supply / borrow, or rate swap of
                these assets are unavailable. Withdrawals and debt repayments
                are allowed. Follow the{" "}
                <Link href="https://governance.aave.com" underline="always">
                  Aave governance forum
                </Link>{" "}
                for further updates.
              </span>
            </Warning>
          )}
        </Box>
      )}
      {showFrozenMarketsToggle && (
        <MarketAssetsList reserves={frozenOrPausedReserves} loading={loading} />
      )}

      {/* Show no search results message if nothing hits in either list */}
      {!loading && filteredData.length === 0 && !displayGho && (
        <NoSearchResults
          searchTerm={searchTerm}
          subtitle={
            <span>
              We couldn&apos;t find any assets related to your search. Try again
              with a different asset name, symbol, or address.
            </span>
          }
        />
      )}
    </ListWrapper>
  )
}