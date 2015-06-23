////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////

module SexyTable
{
    /**
     * This is what emulates the auto sizing features of a normal HTML <table>.
     */
    export class Sizer
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;

        /**
         * Give us the tables top level container element.
         * And we will ensure it's rows & cells are sized correctly.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();
            this.ForceResize();
            this.UnhideContainer();
            $(window).resize(this.ForceResize.bind(this));
        }

        /**
         * When a table is updated with new data we will need to make sure it's
         * sized correctly. This is used by the Writer and may be used directly
         * at anytime if required.
         */
        public ForceResize(): void
        {
            this.container.width('100%');
            this.table.GetCells().removeData('dont-resize');
            this.table.GetCells().css('width', 'auto');
            this.table.GetRows().css('height', 'auto');
            this.SetWidthOfColumns();
            this.SetHeightOfRows();
            this.IncreaseLastColumn();
            this.CheckForOverFlownRows(this.table.GetColumns());
        }

        /**
         * Sets the width of each of the columns in the table.
         *
         * This turned out to be much more complex that I first thought.
         * I'm sure this method is not as efficent as it could be but for
         * now it works.
         */
        protected SetWidthOfColumns(): void
        {
            // Get all our cells grouped by columns
            var columns = this.table.GetColumns();

            // Grab the natural width of each column
            var colWidths = [];
            columns.forEach(function(col)
            {
                var maxWidth = -1;

                col.forEach(function(cell)
                {
                    var cellWidth = $(cell).outerWidth(true);

                    if (cellWidth > maxWidth)
                    {
                        maxWidth = cellWidth;
                    }
                }, this);

                colWidths.push(maxWidth);
            }, this);

            // Sum up the widths
            var totalWidth = colWidths.reduce(function(a, b){ return a + b}, 0);

            // Now convert the column widths into percentages
            columns.forEach(function(col, colNo)
            {
                var width = (colWidths[colNo] / totalWidth * 100) + '%';
                col.forEach(function(cell){ $(cell).css('width', width); });
            });

            // At this point the columns are sized with the correct ratios.
            // However we can obviously run into the issue where a cell
            // overflows. In this case we need to increase the width of the
            // column that the overflown cell belongs to but then remove the
            // width from other columns. This calculates the amount of width
            // that needs to be removed from the table.
            var remove = 0;

            this.table.GetColumns().forEach(function(col, colNo)
            {
                // Get all the inner widths of each cell in the column.
                var widths = this.GetColWidths(col);

                // Add the diff to the total amount we need to remove.
                remove = remove + widths.diff;

                // Set the width of each cell in the column to the maximum.
                // This lines up the cells in the column and converts the
                // percentage width into a pixel value. From this point forward
                // we work with pixels.
                col.forEach(function(cell)
                {
                    $(cell).css('width', widths.max);
                });
            }, this);

            // Now we need to adjust the size of the columns in the table so
            // everything fits. This is a recursive process until we have no
            // more columns to resize.
            this.ReDistributeWidth(remove, columns);
        }

        /**
         * Given an amount of width to remove and a set of columns to remove it
         * from. This will resize the columns in the table so that everything
         * fits.
         */
        protected ReDistributeWidth(remove: number, columns: Array<Array<Element>>): void
        {
            // The amount of width we need to remove from each column.
            var removePerCol = remove / this.GetResizeableCols();

            // In some cases we may reach the minimum size of a cell / column.
            // This is a taly of the number of pixels we failed to remove.
            var failedToRemove = 0;

            // Loop through the columns
            for (var colNo = 0; colNo < columns.length; colNo++)
            {
                var column = columns[colNo];

                // We can't resize this column, so skip it.
                if ($(column[0]).data('dont-resize') === true) continue;

                // Grab the current column width
                var currentColumnWidth = this.GetColumnWidth(column);

                // Calculate the new width of the column that we are aiming for.
                // NOTE: This is the width we WANT but may NOT get.
                var idealColumnWidth = currentColumnWidth - removePerCol;

                // If the total amount to remove is less than 1 then we only
                // need to remove 1 pixel from one column. Removing less than 1
                // pixel doesn't really work - no such thing as half a pixel.
                if (remove <= 1)
                {
                    idealColumnWidth = currentColumnWidth - 1;
                }

                // This will be the minimum width of the column,
                // if we reach it's minimum width that is.
                var columnMinimumWidth = -1;

                // Loop through each cell in the column and attempt to resize it
                for (var cellNo = 0; cellNo < column.length; cellNo++)
                {
                    var cell = column[cellNo];

                    // Set the new width of the cell
                    $(cell).css('width', idealColumnWidth);

                    // Check if the cell has overflown.
                    var innerWidth = $(cell).find('.inner').outerWidth(true);
                    if (innerWidth > idealColumnWidth)
                    {
                        // This cell has reached it's minimum size.
                        $(cell).css('width', innerWidth);

                        // Only update the column minimum width
                        // if it's larger than the previous value.
                        if (innerWidth > columnMinimumWidth)
                        {
                            columnMinimumWidth = innerWidth;
                        }
                    }
                }

                // Set the new column width, this lines up the cells again.
                var newColumnWidth = this.GetColumnWidth(column);
                for (var cellNo = 0; cellNo < column.length; cellNo++)
                {
                    $(column[cellNo]).css('width', newColumnWidth);
                }

                // Once a column has reached it's minimum size,
                // ensure we do not attempt to resize it again.
                if (columnMinimumWidth > 0)
                {
                    $(column[0]).data('dont-resize', true);

                    // The total amount to remove was less than 1px but we
                    // failed to remove it from this column. As there are more
                    // columns left that are resizeable we don't want to add
                    // the 1px to the failedToRemove tally.
                    if (remove <= 1 && this.GetResizeableCols() > 0)
                    {
                        continue;
                    }

                    // It also means that we were unable
                    // to remove some width from the table.
                    failedToRemove = failedToRemove +
                    (
                        columnMinimumWidth - idealColumnWidth
                    );
                }
                else
                {
                    // The total amount to remove was less than 1px and we
                    // successfully managed to remove that one pixel. So we
                    // do not need to loop through rest of the columns.
                    if (remove <= 1)
                    {
                        break;
                    }
                }
            }

            // Do we still have pixels to remove from the table?
            if (failedToRemove > 0)
            {
                // Do we have have resizeable columns left?
                if (this.GetResizeableCols() > 0)
                {
                    // We have at least one resizeable column
                    // left so lets run ourselves again.
                    this.ReDistributeWidth(failedToRemove, columns);
                }
                else
                {
                    // Set the minimum width of the table.
                    // The table will now overflow it's parent
                    // just like a real table would.
                    this.container.css('width', this.GetMinimumTableSize());
                }
            }
        }

        /**
         * Loops through all rows in the table and sets their height.
         */
        protected SetHeightOfRows(): void
        {
            var that = this;

            this.table.GetRows().each(function(index, row)
            {
                $(row).css('height', that.CalculateRowHeight(row));
            });

            // Because the last row in the table also has a bottom border we
            // need to increase it's height by the height of the border.
            var last = this.table.GetRows().last();
            last.css('height', last.outerHeight(true) + this.GetRowBorder());
        }

        /**
         * Given a UL row element this will loop through all it's LI cells
         * and calculate the rows maximum height.
         */
        protected CalculateRowHeight(row: Element): number
        {
            var maxHeight = -1;

            $(row).find('li').each(function(index, cell)
            {
                if ($(cell).outerHeight(true) > maxHeight)
                {
                    maxHeight = $(cell).outerHeight(true);
                }
            });

            return maxHeight + this.GetRowBorder();
        }

        /**
         * In some cases we end up with some spare space.
         * Lets fill that spare space.
         */
        protected IncreaseLastColumn(): void
        {
            // Scope hack
            var that = this;

            // Loop through each of the rows
            this.table.GetRows().each(function(rowNo, row)
            {
                // Add up the cell widths
                var total = 0;
                $(row).find('li').each(function(cellNo, cell)
                {
                    total = total + $(cell).outerWidth(true);
                });

                // By how much is the row short?
                var add = $(row).innerWidth() - total;

                // If we have anything to add, lets add it
                if (add > 0)
                {
                    var last = $(row).find('li').last();
                    last.css('width', last.outerWidth(true) + add);
                }
            });
        }

        /**
         * Even after all our fancy resizing we still end up
         * with overflown rows in some cases rows.
         *
         * This will be due to a number of reasons:
         *
         *   - Rounding Errors, diffrent browsers do this better than others.
         *     Also I believe jQuery plays a role in the rounding of width and
         *     height values.
         *
         *   - Margins, Paddings & Boarders that have not been accounted for.
         *     Over time hopefully we will be able to catch more and more of
         *     these special cases.
         *
         *   - Other maths errors that I may have made...
         *     If you find one help me fix it :)
         *
         * Anyway this method will apply one last resize of the table to ensure
         * everything fits... hopefully :)
         */
        protected CheckForOverFlownRows(columns, recurse = 0): void
        {
            // Because IE is stupid!
            if (recurse > 10) return;

            // Scope hack
            var that = this;

            // Assume we havn't resized anything for now
            var resized = false;

            // Loop through each of the rows
            this.table.GetRows().each(function(rowNo, row)
            {
                // Check if the row has overflown
                if ($(row).prop('scrollHeight') > $(row).outerHeight())
                {
                    // Add up the cell widths
                    var total = 0;
                    $(row).find('li').each(function(cellNo, cell)
                    {
                        total = total + $(cell).outerWidth(true);
                    });

                    // By how much has the row overflown?
                    var remove = total - $(row).innerWidth();

                    // Because IE is stupid again!
                    if (remove < 1) remove = that.GetColumnBorder();

                    // Guess what it's time to remove some more width
                    that.ReDistributeWidth(remove, columns);

                    // Now that we have adjusted the column widths
                    // we need to recalculate the rows height.
                    $(row).css('height', 'auto');
                    $(row).css('height', that.CalculateRowHeight(row));

                    // Make sure we check again that we have no rows overflowing
                    resized = true;
                }
            });

            // If we resized something we should recurse again.
            if (resized) this.CheckForOverFlownRows(columns, ++recurse);
        }

        /**
         * Calculates the minimum size of the table.
         */
        protected GetMinimumTableSize(): number
        {
            var minimum = 0, border = this.GetColumnBorder();

            var row = this.table.GetRows().first();
            row.find('li').each(function(cellNo, cell)
            {
                minimum = minimum + $(cell).find('.inner').outerWidth(true);

                // Account for border
                minimum = minimum + border;
            });

            // Account for padding applied to the row
            minimum = minimum + this.GetRowPadding();

            // Add the border again for IE
            minimum = minimum + border;

            return minimum;
        }

        /**
         * Counts the number of columns in the table that
         * still have space to spare and can be resized.
         */
        protected GetResizeableCols(): number
        {
            var columns = this.table.GetColumns();

            var resizeable_cols = this.GetNumberOfCols();

            for (var i = 0; i < columns.length; i++)
            {
                if ($(columns[i][0]).data('dont-resize') === true)
                {
                    --resizeable_cols;
                }
            }

            return resizeable_cols;
        }

        /**
         * Gets the inner widths of all cells in the provided column.
         * Performs some basic calcs on the widths and returns an object
         * for easy access to the results.
         */
        protected GetColWidths(col: Array<Element>): ColWidths
        {
            var widths = [];

            for (var i = 0; i < col.length; i++)
            {
                widths.push
                (
                    $(col[i]).find('.inner').outerWidth(true) +
                    this.GetColumnBorder()
                );
            }

            var min = Math.min.apply(null, widths);
            var max = Math.max.apply(null, widths);
            var diff = max - min;

            return { widths: widths, min: min, max: max, diff: diff };
        }

        /**
         * Similar to GetColWidths but only returns the columns max width.
         * Doesn't consider the inner either.
         */
        protected GetColumnWidth(col: Array<Element>): number
        {
            var widths = [];

            for (var i = 0; i < col.length; i++)
            {
                widths.push($(col[i]).outerWidth(true));
            }

            return Math.max.apply(null, widths);
        }

        /**
         * To make sure we don't overflow any rows of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all rows of the table.
         */
        protected GetRowBorder(): number
        {
            var row = this.container.find('ul').first();

            return row.outerHeight(true) - row.innerHeight();
        }

        /**
         * In some css layouts you may like to add horizontal padding to rows.
         * Creating a frame and inseting the actual table contents.
         * This method calculates that padding if applied.
         *
         * > NOTE: We assume the same padding has been applied to all rows.
         */
        protected GetRowPadding(): number
        {
            var row = this.container.find('ul').first();

            return row.outerWidth(true) - row.width();
        }

        /**
         * To make sure we don't overflow any cells of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all cells of the table.
         */
        protected GetColumnBorder(): number
        {
            var cell = this.container.find('li').first();

            return cell.outerWidth(true) - cell.innerWidth();
        }

        /**
         * Gets the number of columns in the table.
         *
         * > NOTE: At the this stage the equivalent of colspans are not
         * > supported. The first UL row in the table is assumed to have
         * > the same number of LI cells as the rest of the table.
         */
        protected GetNumberOfCols(): number
        {
            return this.table.GetColumns().length;
        }

        /**
         * After all sizing functions have taken place, it's safe to show the
         * table, knowing it won't look like a dogs breakfast, regurgitated.
         */
        protected UnhideContainer(): void
        {
            this.container.css('visibility', 'visible');
        }
    }

    export interface ColWidths
    {
        widths: Array<number>;
        min: number;
        max: number;
        diff: number;
    }
}
