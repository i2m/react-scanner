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
import type { GetScannerResultParams, SerdeRankBy } from "./task-types";
import "./table.css";
import { Spinner } from "@heroui/react";

const DEFAULT_TABLE_HEIGHT = 600;
const DEFAULT_TABLE_ROW_HEIGHT = 32;

const nf = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface TableProps {
  filter: GetScannerResultParams;
}
export function ScannerTable({ filter: initFilter }: TableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const [filter, setFilter] = useState(initFilter);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: filter.rankBy!,
    direction: filter.orderBy === "asc" ? "ascending" : "descending",
  });

  const {
    tokens,
    totalTokensCount,
    fetchNextPage,
    changeRequestsFilter,
    loading,
  } = useTableModel(filter);

  const loadMore = useCallback(() => {
    if (loading) {
      return;
    }
    fetchNextPage();
  }, [fetchNextPage, loading]);

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

  useEffect(() => {
    changeRequestsFilter(filter);
  }, [changeRequestsFilter, filter]);

  const sort = useCallback((sortDescriptor: SortDescriptor) => {
    setFilter((filter) => ({
      ...filter,
      orderBy: sortDescriptor.direction === "ascending" ? "asc" : "desc",
      rankBy: sortDescriptor.column as SerdeRankBy,
    }));
    setSortDescriptor(sortDescriptor);
  }, []);

  return (
    <div className="container" ref={containerRef}>
      <Table
        ref={tableRef}
        aria-label="Scanner Table"
        classNames={{
          table: "table",
        }}
        isHeaderSticky
        isVirtualized
        bottomContent={
          hasMore ? (
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
        onSortChange={sort}
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
                <PriceHighlighter id={token.id} value={`$${token.priceUsd}`} />
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
