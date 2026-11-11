import { forwardRef, memo, useCallback, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { FixedSizeList, areEqual, type ListChildComponentProps } from 'react-window';
import styled from 'styled-components';
import { focusRing } from '../../styles/GlobalStyle';

export type SortDirection = 'asc' | 'desc';
export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: string;
  /** CSS grid track size, e.g. `120px` or `minmax(200px, 2fr)`. */
  width: string;
  align?: 'left' | 'right';
  /** Providing a sort accessor makes the column sortable. */
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  label: string;
  rows: readonly T[];
  columns: readonly Column<T>[];
  getRowId: (row: T) => string;
  initialSort?: SortState;
  /** Switch to a windowed (virtualized) body when row count exceeds this. */
  virtualizeThreshold?: number;
  rowHeight?: number;
  maxBodyHeight?: number;
  emptyMessage?: string;
}

const Scroller = styled.div`
  overflow-x: auto;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const Table = styled.div`
  min-width: 960px;
`;

const RowGrid = styled.div`
  display: grid;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderRow = styled(RowGrid)`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`;

const Cell = styled.div<{ $align?: 'left' | 'right' }>`
  padding: 0 ${({ theme }) => theme.space(3)};
  text-align: ${({ $align }) => $align ?? 'left'};
  justify-self: stretch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

const HeaderCell = styled(Cell)`
  padding-top: ${({ theme }) => theme.space(2.5)};
  padding-bottom: ${({ theme }) => theme.space(2.5)};
`;

const SortButton = styled.button<{ $align?: 'left' | 'right' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  flex-direction: ${({ $align }) => ($align === 'right' ? 'row-reverse' : 'row')};
  padding: ${({ theme }) => theme.space(1)};
  margin: -${({ theme }) => theme.space(1)};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: none;
  color: inherit;
  font-weight: inherit;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
  ${focusRing}
`;

const Empty = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space(8)};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

interface RowProps<T> {
  row: T;
  columns: readonly Column<T>[];
  gridTemplate: string;
  rowIndex: number;
  height: number;
  style?: CSSProperties;
}

function TableRowInner<T>({ row, columns, gridTemplate, rowIndex, height, style }: RowProps<T>) {
  return (
    <RowGrid
      role="row"
      aria-rowindex={rowIndex}
      style={{ ...style, gridTemplateColumns: gridTemplate, height }}
    >
      {columns.map((c) => (
        <Cell key={c.key} role="cell" $align={c.align}>
          {c.render(row)}
        </Cell>
      ))}
    </RowGrid>
  );
}

/**
 * Memoized row: re-renders only when its row object, column definitions or
 * position change. Combined with entity-adapter immutability, an inline edit
 * re-renders exactly one row.
 */
const TableRow = memo(TableRowInner) as typeof TableRowInner;

interface ListData<T> {
  rows: readonly T[];
  columns: readonly Column<T>[];
  gridTemplate: string;
  rowHeight: number;
}

const VirtualRow = memo(function VirtualRow({ index, style, data }: ListChildComponentProps<ListData<unknown>>) {
  return (
    <TableRow
      row={data.rows[index]}
      columns={data.columns}
      gridTemplate={data.gridTemplate}
      rowIndex={index + 2}
      height={data.rowHeight}
      style={style}
    />
  );
}, areEqual);

const RowGroup = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} role="rowgroup" {...props} />
));
RowGroup.displayName = 'RowGroup';

function compare(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function DataTable<T>({
  label,
  rows,
  columns,
  getRowId,
  initialSort,
  virtualizeThreshold = 100,
  rowHeight = 52,
  maxBodyHeight = 560,
  emptyMessage = 'No rows to display',
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | undefined>(initialSort);
  const gridTemplate = useMemo(() => columns.map((c) => c.width).join(' '), [columns]);

  const sortedRows = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const accessor = col.sortValue;
    const sign = sort!.direction === 'asc' ? 1 : -1;
    // Decorate-sort-undecorate so the accessor runs once per row.
    return rows
      .map((row) => ({ row, v: accessor(row) }))
      .sort((a, b) => sign * compare(a.v, b.v))
      .map((x) => x.row);
  }, [rows, columns, sort]);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }, []);

  const virtualize = sortedRows.length > virtualizeThreshold;
  const listData = useMemo<ListData<T>>(
    () => ({ rows: sortedRows, columns, gridTemplate, rowHeight }),
    [sortedRows, columns, gridTemplate, rowHeight],
  );

  return (
    <Scroller>
      <Table role="table" aria-label={label} aria-rowcount={sortedRows.length + 1}>
        <div role="rowgroup">
          <HeaderRow role="row" aria-rowindex={1} style={{ gridTemplateColumns: gridTemplate }}>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              const ariaSort = active ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : c.sortValue ? 'none' : undefined;
              return (
                <HeaderCell key={c.key} role="columnheader" aria-sort={ariaSort} $align={c.align}>
                  {c.sortValue ? (
                    <SortButton type="button" $align={c.align} onClick={() => toggleSort(c.key)} data-sort-key={c.key}>
                      {c.header}
                      <span aria-hidden="true">{active ? (sort!.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </SortButton>
                  ) : (
                    c.header
                  )}
                </HeaderCell>
              );
            })}
          </HeaderRow>
        </div>

        {sortedRows.length === 0 ? (
          <Empty role="status">{emptyMessage}</Empty>
        ) : virtualize ? (
          <FixedSizeList
            height={Math.min(maxBodyHeight, sortedRows.length * rowHeight)}
            width="100%"
            itemCount={sortedRows.length}
            itemSize={rowHeight}
            itemData={listData as ListData<unknown>}
            itemKey={(index, data) => getRowId(data.rows[index] as T)}
            innerElementType={RowGroup}
            overscanCount={6}
          >
            {VirtualRow}
          </FixedSizeList>
        ) : (
          <div role="rowgroup">
            {sortedRows.map((row, i) => (
              <TableRow
                key={getRowId(row)}
                row={row}
                columns={columns}
                gridTemplate={gridTemplate}
                rowIndex={i + 2}
                height={rowHeight}
              />
            ))}
          </div>
        )}
      </Table>
    </Scroller>
  );
}
