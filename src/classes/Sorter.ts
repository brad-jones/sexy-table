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
     * Adds sorting controls to the first row of the table.
     *
     * > NOTE: We assume font awesome icons are avaliable.
     */
    export class Sorter
    {
        /**
         * The main container for the entire table.
         */
        private container: JQuery;

        /**
         * Makes the natural sort algorithm ignore case.
         */
        private caseInsensitive = true;

        /**
         * To allow for super fast sorts we read the DOM into a JSON object
         * once. We then sort the JSON and redraw the table. This object also
         * represents the intial state of the table so we can easily go back to
         * it when the sorting is toggled off.
         */
        private tableData: Array<Object>;

        /**
         * Give us the tables top level container element.
         * And we will add some sort controls to the tables first row.
         */
        public constructor(table: JQuery)
        {
            this.container = table;

            this.EnsureTableHasThead();

            this.CacheTableData();

            this.InsertSortableToggles();
        }

        private EnsureTableHasThead(): void
        {
            if (this.container.find('.thead, .tbody').length != 2)
            {
                throw new Error
                (
                    'Sortable tables MUST use .thead and .tbody containers!'
                );
            }
        }

        private CacheTableData(): void
        {
            var headings = [];
            this.container.find('.thead ul').first().find('li').each
            (
                function(index, cell)
                {
                    headings.push($(cell).find('.inner').text());
                }
            );

            var data = [];
            this.container.find('.tbody ul').each(function(rowNo, row)
            {
                // Add a reference to the dom row
                var rowData = { _dom: row };

                $(row).find('li').each(function(cellNo, cell)
                {
                    // Ignore columns with no heading as these can't be sorted
                    if (headings[cellNo] != "")
                    {
                        rowData[headings[cellNo]] = $(cell).find('.inner').text();
                    }
                });

                data.push(rowData);
            });

            this.tableData = data;
        }

        private InsertSortableToggles(): void
        {
            var that = this;

            this.container.find('.thead ul').first().find('.inner').each
            (
                function(index, cell)
                {
                    // Don't add sorting to empty cells.
                    // Empty cells are most likly to be columns that contain
                    // un-sortable data, such as buttons or other HTML elements.
                    if ($(cell).text() != "")
                    {
                        $(cell).append('<i class="fa fa-sort"></i>');
                        $(cell).css('cursor', 'pointer');
                        $(cell).click(that.OnSort.bind(that, cell));
                    }
                }
            );
        }

        private OnSort(cell: Element): void
        {
            // What state of sorting are we currently in?
            // We use the fa icon to tell us that.
            var sortState, icon = $(cell).find('i');

            if (icon.hasClass('fa-sort'))
            {
                sortState = 'asc';
                icon.removeClass('fa-sort');
                icon.addClass('fa-sort-asc');
            }
            else if (icon.hasClass('fa-sort-asc'))
            {
                sortState = 'desc';
                icon.removeClass('fa-sort-asc');
                icon.addClass('fa-sort-desc');
            }
            else if (icon.hasClass('fa-sort-desc'))
            {
                sortState = 'as-loaded';
                icon.removeClass('fa-sort-desc');
                icon.addClass('fa-sort');
            }

            // Right now multicolumn sort is not supported
            // Lets reset all other columns to default
            var otherIcons = this.container.find('.thead i').not(icon);
            otherIcons.removeClass('fa-sort-asc');
            otherIcons.removeClass('fa-sort-desc');
            otherIcons.addClass('fa-sort');

            // Now sort the table data and re draw the table
            switch(sortState)
            {
                case 'asc':

                    this.ReDrawTable
                    (
                        this.newTableData()
                            .sort(this.sortByKey($(cell).text()))
                    );

                break;

                case 'desc':

                    this.ReDrawTable
                    (
                        this.newTableData()
                            .sort(this.sortByKey($(cell).text()))
                            .reverse()
                    );

                break;

                default:
                    this.ReDrawTable(this.tableData);
            }
        }

        private ReDrawTable(data: Object): void
        {
            var rows = new Array<Element>();

            for (var row in data)
            {
                rows.push(data[row]["_dom"]);
            }

            this.container.find('.tbody').empty().append(rows);
        }

        private newTableData(): Array<Object>
        {
            return this.tableData.slice(0);
        }

        private sortByKey(key)
        {
            var that = this;

            return function (a: any, b: any)
            {
                return that.naturalSort(a[key], b[key]);
            }
        }

        /**
         * Natural Sort algorithm for Javascript
         *
         * @author Jim Palmer (based on chunking idea from Dave Koelle)
         * @see https://github.com/overset/javascript-natural-sort
         */
        private naturalSort(a: any, b: any): number
        {
            var re = /(^([+\-]?(?:\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[\da-fA-F]+$|\d+)/g,
                sre = /^\s+|\s+$/g,   // trim pre-post whitespace
                snre = /\s+/g,        // normalize all whitespace to single ' ' character
                dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
                hre = /^0x[0-9a-f]+$/i,
                ore = /^0/,
                i = function(s) {
                    return (this.caseInsensitive && ('' + s).toLowerCase() || '' + s).replace(sre, '');
                },
                // convert all to strings strip whitespace
                x = i(a) || '',
                y = i(b) || '',
                // chunk/tokenize
                xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
                yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
                // numeric, hex or date detection
                xD = parseInt(x.match(hre) == null ? null : x.match(hre).toString(), 16) || (xN.length !== 1 && Date.parse(x)),
                yD = parseInt(y.match(hre) == null ? null : y.match(hre).toString(), 16) || xD && y.match(dre) && Date.parse(y) || null,
                normChunk = function(s, l) {
                    // normalize spaces; find floats not starting with '0', string or 0 if not defined (Clint Priest)
                    return (!s.match(ore) || l == 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
                },
                oFxNcL, oFyNcL;
            // first try and sort Hex codes or Dates
            if (yD) {
                if ( xD < yD ) { return -1; }
                else if ( xD > yD ) { return 1; }
            }
            // natural sorting through split numeric strings and default strings
            for(var cLoc=0, xNl = xN.length, yNl = yN.length, numS=Math.max(xNl, yNl); cLoc < numS; cLoc++) {
                oFxNcL = normChunk(xN[cLoc], xNl);
                oFyNcL = normChunk(yN[cLoc], yNl);
                // handle numeric vs string comparison - number < string - (Kyle Adams)
                if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
                // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
                else if (typeof oFxNcL !== typeof oFyNcL) {
                    oFxNcL += '';
                    oFyNcL += '';
                }
                if (oFxNcL < oFyNcL) { return -1; }
                if (oFxNcL > oFyNcL) { return 1; }
            }
            return 0;
        }
    }
}