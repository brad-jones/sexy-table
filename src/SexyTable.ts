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
     * If set to true we will search for all sexy tables at dom ready and run
     * the automatic width calculations. And then we will show the table.
     *
     * @type boolean
     */
    export var AutoMakeSexy: boolean = true;

    /**
     * Finds All Sexy Tables in the DOM and Initialises Them.
     * If ```AutoMakeSexy``` is true we will run at domready.
     */
    function MakeTablesSexy()
    {
        $('.sexy-table').each(function(index, table)
        {
            new TableSizeCalculator(table);
        });
    }

    /**
     * This is what emulates the auto sizing features of a normal HTML <table>.
     * It's not 100% perfect yet and I hate to think how it will perform in
     * older versions of IE. But it does basically work.
     */
    export class TableSizeCalculator
    {
        private container: JQuery;

        private correctionFactor: number = 1.1;

        public constructor(table: Element, correctionFactor?: number)
        {
            this.container = $(table);

            if (correctionFactor != null)
            {
                this.correctionFactor = correctionFactor;
            }

            this.InsertMissingCells();

            this.InsertCellWrapper();

            this.SetWidthOfCells();

            this.SetHeightOfRows();

            this.UnhideContainer();

            $(window).resize(this.SetWidthOfCells.bind(this));
            $(window).resize(this.SetHeightOfRows.bind(this));
        }

        private InsertMissingCells(): void
        {
            // TODO... the idea here is to automatically create any missing
            // li elements. Kind of like automatic colspans.
        }

        private InsertCellWrapper(): void
        {
            this.container.find('li').wrapInner('<div class="inner"></div>');
        }

        private SetHeightOfRows(): void
        {
            var that = this;

            this.container.find('ul').css('height', 'auto');

            this.container.find('ul').each(function(index, row)
            {
                $(row).css('height', that.CalculateRowHeight(row));
            });
        }

        private CalculateRowHeight(row: Element): number
        {
            var maxHeight = -1;

            $(row).find('li').each(function(index, cell)
            {
                if ($(cell).outerHeight(true) > maxHeight)
                {
                    maxHeight = $(cell).outerHeight(true);
                }
            });

            return maxHeight;
        }

        private SetWidthOfCells(): void
        {
            this.container.find('li').css('width', this.CalculateCellWidth());
        }

        private CalculateCellWidth(): number
        {
            var cols = this.GetNumberOfCols();
            var width = this.GetTotalWidthOfTable();
            var padding = this.GetCellPadding();
            return (width / cols) - padding - this.correctionFactor;
        }

        private UnhideContainer(): void
        {
            this.container.css('visibility', 'visible');
        }

        private GetTotalWidthOfTable(): number
        {
            return this.container.innerWidth();
        }

        private GetNumberOfCols(): number
        {
            return this.container.find('ul').first().find('li').length;
        }

        private GetCellPadding(): number
        {
            var firstCell = this.container.find('li').first();

            return firstCell.outerWidth(true) - firstCell.width();
        }
    }

    // 3... 2... 1... and LiftOff!!!
    $(document).ready(function()
    {
        if (AutoMakeSexy)
        {
            MakeTablesSexy();
        }
    });
}
