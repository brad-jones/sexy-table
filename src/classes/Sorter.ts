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
        protected container: JQuery;

        /**
         * Makes the natural sort algorithm ignore case.
         */
        protected caseInsensitive = true;

        /**
         * Instead of performing sorting in the client we can defer the job to
         * a server backend. See the "Pager" for more details about working
         * with a server backend.
         */
        protected serverCb: Function;

        /**
         * Give us the tables top level container element.
         * And we will add some sort controls to the tables first row.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.EnsureTableHasThead();

            this.InsertSortableToggles();
        }

        /**
         * Sortable tables rely on the thead and tbody containers!
         */
        protected EnsureTableHasThead(): void
        {
            if (this.container.find('.thead, .tbody').length != 2)
            {
                throw new Error
                (
                    'Sortable tables MUST use .thead and .tbody containers!'
                );
            }
        }

        /**
         * Tells us to redirect all sort requests to your callback.
         * The natural sort alograthim included in the class is no longer used.
         * See the "Pager" for more details about working with a server backend.
         */
        public UseServer(serverCb: Function): void
        {
            this.serverCb = serverCb;
        }

        /**
         * In some cases, other features such as the Searcher may redraw the
         * table with new rows. And thus any sorting UI needs to be reset to
         * default.
         */
        public ResetSortIcons(): void
        {
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
        }

        /**
         * Given a set of rows we will sort them. This is used by the Searcher
         * to sort a set of matches using the current sort state.
         *
         * > TODO: Refactor the sorter to cache the current sort state.
         */
        public Sort(rows: Array<Object>): Array<Object>
        {
            var column: string, sortState: string;

            this.container.find('.thead i').each(function(index, element)
            {
                if ($(element).hasClass('fa-sort-asc'))
                {
                    sortState = 'asc';
                }
                else if ($(element).hasClass('fa-sort-desc'))
                {
                    sortState = 'desc';
                }

                if (sortState != null)
                {
                    column = $(element).parent().text()
                    .toLowerCase().replace(" ", "_");

                    return false;
                }
            });

            if (sortState != null)
            {
                rows.sort(this.sortByKey(column));

                if (sortState == 'desc') rows.reverse();
            }

            return rows;
        }

        /**
         * This will create an <i> element for each thead cell.
         * The <i> element will be given apprioriate Font Awesome icon classes.
         * Thus it's important that Font Awesome is loaded when using sortable
         * tables. No checks are done you just won't see any sort icons if you
         * forget to include Font Awersome.
         */
        protected InsertSortableToggles(): void
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

        /**
         * Callback for the thead cells click event.
         */
        protected OnSort(cell: Element): void
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

            // If we have a server callback let's use it instead.
            if (this.serverCb != null)
            {
                this.serverCb
                (
                    $(cell).text().toLowerCase().replace(" ", "_"),
                    sortState
                );

                return;
            }

            // Now sort the table data and re draw the table
            switch(sortState)
            {
                case 'asc':
                    this.table.Redraw(this.SortTable(cell));
                break;

                case 'desc':
                    this.table.Redraw(this.SortTable(cell, true));
                break;

                default:
                    this.table.Redraw(this.table.GetReader().GetSerialized());
            }
        }

        /**
         * Given a column we will sort the table based on that column.
         */
        protected SortTable(cell: Element, reverse = false): Array<Object>
        {
            // Get the column name
            var column = $(cell).text().toLowerCase().replace(" ", "_");

            // Create a copy of the table rows that we can then sort
            var rows = this.table.GetReader().GetSerialized().slice(0);

            // Sort the rows
            rows.sort(this.sortByKey(column));

            // Reverse the sort if need be
            if (reverse) rows.reverse();

            return rows;
        }

        /**
         * Allows us to sort by an objects key.
         */
        protected sortByKey(key)
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
        protected naturalSort(a: any, b: any): number
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
