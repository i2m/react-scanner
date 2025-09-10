import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  type SortDescriptor,
} from "@heroui/table";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { formatDistanceToNowStrict } from "date-fns";
import { useTableModel } from "./table-model";
import type {
  GetScannerResultParams,
  SerdeRankBy,
  SupportedChainName,
} from "./task-types";
import "./table.css";
import {
  Alert,
  Checkbox,
  Select,
  SelectItem,
  Spinner,
  type SharedSelection,
} from "@heroui/react";

interface TableProps {
  filter: GetScannerResultParams;
}
export function ScannerTable({ filter: initFilter }: TableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // ===== FILTERS AND SORTING STATES =====

  const [filter, setFilter] = useState(initFilter);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: filter.rankBy!,
    direction: filter.orderBy === "asc" ? "ascending" : "descending",
  });

  const [selectedChain, setSelectedChain] = useState("ALL");
  const [selectedMinVol24, setSelectedMinVol24] = useState(
    (filter.minVol24H || "ANY").toString(),
  );
  const [selectedMaxAge, setSelectedMaxAge] = useState(
    (filter.maxAge || "ANY").toString(),
  );
  const [isNotHP, setIsNotHP] = useState<boolean>(filter.isNotHP || true);

  // ===== MAIN TABLE LOGIC IN HOOK =====

  const {
    tokens,
    totalTokensCount,
    fetchNextPage,
    changeRequestsFilter,
    loading,
    error,
  } = useTableModel(filter);

  // ===== TABLE INFINITE PAGINATION =====

  const loadMore = useCallback(() => {
    if (loading || error) {
      return;
    }
    fetchNextPage();
  }, [error, fetchNextPage, loading]);

  const [hasMore, setHasMore] = useState(false);
  const [loaderRef, scrollerRef] = useInfiniteScroll({
    hasMore,
    onLoadMore: loadMore,
    shouldUseLoader: true,
  });

  useEffect(() => {
    setHasMore(totalTokensCount > tokens.length);
    if (containerRef.current && containerRef.current!.firstElementChild) {
      scrollerRef.current = containerRef.current
        .firstElementChild as HTMLElement;
    }
  }, [scrollerRef, tokens.length, totalTokensCount]);

  // ===== TABLE FILTERS AND SORTING HANDLERS =====

  useEffect(() => {
    changeRequestsFilter(filter);
  }, [changeRequestsFilter, filter]);

  const onSortChange = useCallback((sortDescriptor: SortDescriptor) => {
    setFilter((filter) => ({
      ...filter,
      orderBy: sortDescriptor.direction === "ascending" ? "asc" : "desc",
      rankBy: sortDescriptor.column as SerdeRankBy,
    }));
    setSortDescriptor(sortDescriptor);
  }, []);

  const onChainFilterChange = useCallback(
    (keys: SharedSelection) => {
      const chain = keys.currentKey || "ALL";
      setSelectedChain(chain);

      if (chain === "ALL") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { chain, ...filterWithoutChain } = filter;
        setFilter(filterWithoutChain);
      } else {
        setFilter((filter) => ({
          ...filter,
          chain: chain as SupportedChainName,
        }));
      }
    },
    [filter],
  );

  const onMinVol24FilterChange = useCallback(
    (keys: SharedSelection) => {
      const minVol24H = keys.currentKey || "ANY";
      setSelectedMinVol24(minVol24H);

      if (minVol24H === "ANY") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { minVol24H, ...filterWithoutMinVol24H } = filter;
        setFilter(filterWithoutMinVol24H);
      } else {
        setFilter((filter) => ({
          ...filter,
          minVol24H: parseInt(minVol24H, 10),
        }));
      }
    },
    [filter],
  );

  const onMaxAgeFilterChange = useCallback(
    (keys: SharedSelection) => {
      const maxAge = keys.currentKey || "ANY";
      setSelectedMaxAge(maxAge);

      if (maxAge === "ANY") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxAge, ...filterWithoutMaxAge } = filter;
        setFilter(filterWithoutMaxAge);
      } else {
        setFilter((filter) => ({
          ...filter,
          maxAge: parseInt(maxAge, 10),
        }));
      }
    },
    [filter],
  );

  const onIsNotHPChange = useCallback((isNotHP: boolean) => {
    setIsNotHP(isNotHP);
    setFilter((filter) => ({
      ...filter,
      isNotHP,
    }));
  }, []);

  return (
    <div className="container h-full flex flex-col">
      {/* Error Alert */}
      {error && (
        <div className="w-full flex flex-row gap-1 my-4 mx-2">
          <Alert color="danger" title={error} />
        </div>
      )}
      {/* Filters */}
      <div className="w-full flex flex-row gap-1 my-4 mx-2">
        <Select
          className="max-w-32"
          label="Select Chain"
          size="sm"
          items={chains}
          selectedKeys={[selectedChain]}
          selectionMode="single"
          onSelectionChange={onChainFilterChange}
        >
          {(item) => (
            <SelectItem id={item.key} key={item.key}>
              {item.label}
            </SelectItem>
          )}
        </Select>
        <Select
          className="max-w-32"
          label="Volume in 24h"
          size="sm"
          items={minVol24H}
          selectedKeys={[selectedMinVol24]}
          selectionMode="single"
          onSelectionChange={onMinVol24FilterChange}
        >
          {(item) => (
            <SelectItem id={item.key} key={item.key}>
              {item.label}
            </SelectItem>
          )}
        </Select>
        <Select
          className="max-w-32"
          label="Age"
          size="sm"
          items={maxAge}
          selectedKeys={[selectedMaxAge]}
          selectionMode="single"
          onSelectionChange={onMaxAgeFilterChange}
        >
          {(item) => (
            <SelectItem id={item.key} key={item.key}>
              {item.label}
            </SelectItem>
          )}
        </Select>
        <Checkbox
          isSelected={isNotHP}
          onValueChange={onIsNotHPChange}
          className="ml-2"
        >
          Exclude honeypots
        </Checkbox>
      </div>

      {/* Tokens Table */}
      <div ref={containerRef} className="grow">
        <Table
          ref={tableRef}
          aria-label="Scanner Table"
          classNames={{
            table: "table",
          }}
          isHeaderSticky
          isVirtualized
          bottomContent={
            hasMore && !error ? (
              <div
                className="flex w-full justify-center"
                ref={loaderRef as React.Ref<HTMLDivElement>}
              >
                <Spinner />
              </div>
            ) : null
          }
          maxTableHeight={
            containerRef.current?.clientHeight || DEFAULT_TABLE_HEIGHT
          }
          rowHeight={DEFAULT_TABLE_ROW_HEIGHT}
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
        >
          <TableHeader>
            <TableColumn className="name">Token</TableColumn>
            <TableColumn className="exchange">Exchange</TableColumn>
            <TableColumn className="price">Price</TableColumn>
            <TableColumn allowsSorting key="mcap">
              Marketcap
            </TableColumn>
            <TableColumn allowsSorting key="volume">
              Volume
            </TableColumn>
            <TableColumn allowsSorting key="price5M">
              5m
            </TableColumn>
            <TableColumn allowsSorting key="price1H">
              1h
            </TableColumn>
            <TableColumn allowsSorting key="price6H">
              6h
            </TableColumn>
            <TableColumn allowsSorting key="price24H">
              24h
            </TableColumn>
            <TableColumn allowsSorting key="age">
              Age
            </TableColumn>
            <TableColumn allowsSorting key="buys">
              Buys
            </TableColumn>
            <TableColumn allowsSorting key="sells">
              Sells
            </TableColumn>
            <TableColumn allowsSorting key="liquidity">
              Liquidity
            </TableColumn>
          </TableHeader>
          <TableBody
            items={tokens}
            emptyContent={
              !loading && !hasMore ? (
                <div className="flex w-full justify-center">
                  No tokens to display
                </div>
              ) : null
            }
          >
            {(token) => (
              <TableRow key={token.id}>
                <TableCell
                  className="name"
                  title={`${token.tokenName}/${token.chain}`}
                >{`${token.tokenName}/${token.chain}`}</TableCell>
                <TableCell className="exchange" title={token.exchange}>
                  {token.exchange}
                </TableCell>
                <TableCell className="price">
                  <PriceHighlighter
                    id={token.id}
                    value={`$${token.priceUsd}`}
                  />
                </TableCell>
                <TableCell>{`$${nf.format(token.mcap)}`}</TableCell>
                <TableCell>{`$${nf.format(token.volumeUsd)}`}</TableCell>
                <TableCell>{`${nf.format(token.priceChangePcs["5m"])}%`}</TableCell>
                <TableCell>{`${nf.format(token.priceChangePcs["1h"])}%`}</TableCell>
                <TableCell>{`${nf.format(token.priceChangePcs["6h"])}%`}</TableCell>
                <TableCell>{`${nf.format(token.priceChangePcs["24h"])}%`}</TableCell>
                <TableCell>
                  {formatDistanceToNowStrict(token.tokenCreatedTimestamp)}
                </TableCell>
                <TableCell>{token.transactions.buys}</TableCell>
                <TableCell>{token.transactions.sells}</TableCell>
                <TableCell>{`$${nf.format(token.liquidity.current)} (${nf.format(token.liquidity.changePc)}%)`}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PriceHighlighter({ id, value }: { id: string; value: string }) {
  const [prevValue, setPrevValue] = useState(value);
  const [prevId, setPrevId] = useState(id);
  const [style, setStyle] = useState("price-stable");

  useEffect(() => {
    setPrevValue(value);
    setPrevId(id);
  }, [id, value]);

  useEffect(() => {
    if (value < prevValue) {
      setStyle("price-dec");
    } else if (value > prevValue) {
      setStyle("price-inc");
    } else {
      setStyle("price-stable");
    }
  }, [prevValue, value]);

  useEffect(() => {
    if (prevId !== id) {
      setStyle("price-stable");
    }
  }, [prevId, id]);

  return <span className={style}>{value}</span>;
}

const nf = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DEFAULT_TABLE_HEIGHT = 600;
const DEFAULT_TABLE_ROW_HEIGHT = 32;

// ===== TABLE FILTERS CHECKBOX VALUES =====

const chains = [
  { key: "ALL", label: "All" },
  { key: "ETH", label: "ETH" },
  { key: "SOL", label: "SOL" },
  { key: "BASE", label: "BASE" },
  { key: "BSC", label: "BSC" },
];

const minVol24H = [
  { key: "ANY", label: "Any" },
  { key: "1000", label: ">$1K" },
  { key: "5000", label: ">$5K" },
  { key: "10000", label: ">$10K" },
  { key: "50000", label: ">$50K" },
  { key: "100000", label: ">$100K" },
  { key: "250000", label: ">$250K" },
  { key: "5000000", label: ">$500K" },
  { key: "1000000", label: ">$1M" },
];

const maxAge = [
  { key: "ANY", label: "Any" },
  { key: `${1 * 60 * 60}`, label: "1 hour" },
  { key: `${3 * 60 * 60}`, label: "3 hours" },
  { key: `${6 * 60 * 60}`, label: "6 hours" },
  { key: `${12 * 60 * 60}`, label: "12 hours" },
  { key: `${24 * 60 * 60}`, label: "24 hours" },
  { key: `${3 * 24 * 60 * 60}`, label: "3 days" },
  { key: `${7 * 24 * 60 * 60}`, label: "7 days" },
];
