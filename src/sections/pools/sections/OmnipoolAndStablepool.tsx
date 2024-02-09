import { useRpcProvider } from "providers/rpcProvider"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { usePools } from "sections/pools/PoolsPage.utils"
import { HeaderValues } from "sections/pools/header/PoolsHeader"
import { HeaderTotalData } from "sections/pools/header/PoolsHeaderTotal"
import { BN_0 } from "utils/constants"
import { SearchFilter } from "sections/pools/filter/SearchFilter"
import { useSearchFilter } from "sections/pools/filter/SearchFilter.utils"
import { arraySearch } from "utils/helpers"
import { PoolsTable } from "sections/pools/table/PoolsTable"
import { StablePoolsTotal } from "sections/pools/header/StablePoolsTotal"
import { VolumeTotal } from "sections/pools/header/VolumeTotal"
import { useSearch } from "@tanstack/react-location"
import { PoolWrapper } from "sections/pools/pool/Pool"
import { PoolsTableSkeleton } from "sections/pools/table/PoolsTableSkeleton"
import { PoolSkeleton } from "sections/pools/pool/PoolSkeleton"
import { EmptySearchState } from "components/EmptySearchState/EmptySearchState"

export const OmnipoolAndStablepool = () => {
  const { t } = useTranslation()
  const { isLoaded } = useRpcProvider()
  const { id } = useSearch<{
    Search: {
      id?: number
    }
  }>()

  if (!isLoaded)
    return id != null ? (
      <PoolSkeleton />
    ) : (
      <>
        <HeaderValues
          values={[
            {
              label: t("liquidity.header.omnipool"),
              content: <HeaderTotalData isLoading />,
            },
            {
              label: t("liquidity.header.stablepool"),
              content: <HeaderTotalData isLoading />,
            },
            {
              withoutSeparator: true,
              label: t("liquidity.header.24hours"),
              content: <HeaderTotalData isLoading />,
            },
          ]}
        />
        <SearchFilter />

        <PoolsTableSkeleton />
      </>
    )

  return <OmnipoolAndStablepoolData />
}

const OmnipoolAndStablepoolData = () => {
  const { t } = useTranslation()
  const { search } = useSearchFilter()
  const { id } = useSearch<{
    Search: {
      id?: number
    }
  }>()

  const pools = usePools()

  const omnipoolTotal = useMemo(() => {
    if (pools.data) {
      return pools.data.reduce(
        (acc, asset) =>
          acc.plus(asset.tvlDisplay.isNaN() ? 0 : asset.tvlDisplay),
        BN_0,
      )
    }

    return BN_0
  }, [pools.data])

  const filteredPools =
    (search && pools.data
      ? arraySearch(pools.data, search, ["symbol", "name"])
      : pools.data) ?? []

  if (id != null) {
    const pool = pools.data?.find((pool) => pool.id === id.toString())

    const isLoading = pools.isLoading

    if (!pool && isLoading) return <PoolSkeleton />

    if (pool) return <PoolWrapper pool={pool} />
  }

  return (
    <>
      <HeaderValues
        values={[
          {
            label: t("liquidity.header.omnipool"),
            content: (
              <HeaderTotalData
                isLoading={pools.isLoading}
                value={omnipoolTotal}
              />
            ),
          },
          {
            label: t("liquidity.header.stablepool"),
            content: <StablePoolsTotal />,
          },
          {
            withoutSeparator: true,
            label: t("liquidity.header.24hours"),
            content: <VolumeTotal />,
          },
        ]}
      />
      <SearchFilter />

      {pools.isLoading ? (
        <PoolsTableSkeleton />
      ) : filteredPools.length ? (
        <PoolsTable data={filteredPools} />
      ) : (
        <EmptySearchState />
      )}
    </>
  )
}
