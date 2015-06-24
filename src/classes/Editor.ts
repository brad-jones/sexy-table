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
     * Allows the cells of the table to be edited.
     *
     * > NOTE: This is not meant to provide anything like the functionality of
     * > an Excel spreadsheet or similar, if that is what you are looking for
     * > see projects like:
     * >
     * >    - http://handsontable.com/
     * >    - http://wijmo.com/products/spreadjs/
     */
    export class Editor
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;

        /**
         * An array of callbacks, that will be run upon a cell being edited.
         */
        protected onEditCallBacks = new Array<OnEditCallback>();

        /**
         * A reference to our span mirror element, to help with width calcs.
         */
        protected mirror: JQuery;

        /**
         * Because the OnSave method is attached to many event handlers.
         * We will ensure it runs onyl when it really needs to.
         */
        protected deBounceTimeout: number;

        /**
         * The number of milliseconds to wait before calling the OnSave method.
         */
        protected deBounceWait = 250;

        /**
         * Editor Constructor
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.mirror = $('<span />');

            this.mirror.css
            ({
                'position': 'absolute',
                'top': '-999px',
                'left': '0px',
                'white-space': 'pre'
            });

            $("body").append(this.mirror);

            this.InsertEditFields();
        }

        /**
         * Registers an OnEdit Callback.
         *
         * > NOTE: To be clear this is called after the cell
         * > has been edited and saved.
         */
        public OnEdit(callBack: OnEditCallback): void
        {
            this.onEditCallBacks.push(callBack);
        }

        /**
         * Inserts an Input Text Box into each Cell.
         */
        public InsertEditFields(): void
        {
            // Scope hack.
            var that = this;

            // Loop through each cell in the table.
            this.table.GetCells().each(function(cellNo, cell)
            {
                // Bail out if we can't edit this cell
                if (!that.IsCellEditable(cell)) return;

                // Bail out if the cell already has an input field
                if ($(cell).find('input').length > 0) return;

                // Grab the inner
                var inner = $(cell).find('.inner');

                // Grab the contents of the cell
                var data = inner.text();

                // Create a new input field
                var input = $('<input />');
                input.attr('type', 'text');
                input.val(data);

                // Create the save callback
                var save = that.OnSave.bind(that, inner);

                // Bind some keyboard shortcuts to the save handler
                //
                // > NOTE: I am debating if we really need this,
                // > now that we save on keyup...
                Mousetrap(input[0]).bind(['enter', 'mod+s'], save);

                // On keyup call the save handler
                input.keyup(save);

                // Replace the contents of the cell with our new input field
                inner.empty().append(input);
            });
        }

        /**
         * This is called after a table been ReDrawn.
         *
         * > NOTE: We do not need to worry about the Mousetrap events,
         * > these appear to continue to work.
         */
        public ReAttachEventHandlers(): void
        {
            this.table.GetCells().parents('.tbody').find('input').each
            (
                (function (inputNo, input)
                {
                    $(input).keyup
                    (
                        this.OnSave.bind(this, $(input).parents('.inner'))
                    );
                }).bind(this)
            );
        }

        /**
         * Not all cells in the table should be editable.
         * Given a cell this will tell us if we are allowed to edit it or not.
         */
        protected IsCellEditable(cell: Element): boolean
        {
            // Editing column headings seems like a dangerous thing.
            if ($(cell).parents('.thead').length > 0) return false;

            // Can't edit cells that have explicitly been set not be editable.
            if ($(cell).data('no-edit') === true) return false;

            // Can't edit cells without a column heading
            var inner = $(cell).find('.inner');
            var heading = this.table.GetReader().GetHeading(inner);
            if (typeof heading === 'undefined') return false;
            if (heading === '') return false;

            // If we get to here we assume the cell is editable.
            return true;
        }

        /**
         * This will grab the contents of the input field
         * and update the table.
         *
         * > NOTE: This does not send any data back to the server!
         * > You must do this yourself with the Reader.
         */
        protected OnSave(cell: JQuery): boolean
        {
            // Setup the debounce
            clearTimeout(this.deBounceTimeout);
            this.deBounceTimeout = setTimeout((function()
            {
                // To help the Sizer we will loop through all our inputs and
                // update their widths accordingly. Otherwise the table size
                // will not change because the input are set 100% width.
                this.table.GetCells().parents('.tbody').find('input').each
                (
                    this.SetWidthOfInput.bind(this)
                );

                // Refresh the table
                if (this.table.HasSearcher())
                {
                    // If the table has a searcher, this includes filterable
                    // tables. We need to update the search index in a smart
                    // way. We can not simply call the Refresh method as it may
                    // re-serialize the table in a "searched" or "filtered"
                    // state which would remove rows from the table.

                    this.table.GetSizer().ForceResize();
                    this.table.GetReader().UpdateOriginal(cell);
                    this.table.GetSearcher().BuildIndexes();
                }
                else
                {
                    this.table.Refresh();
                }

                // Ensure all the inputs have the same width in the same column.
                this.table.GetColumns().forEach(function(col)
                {
                    var maxWidth = -1;
                    col.forEach(function(cell)
                    {
                        var width = $(cell).find('input').width();
                        if (width > maxWidth) maxWidth = width;
                    });

                    col.forEach(function(cell)
                    {
                        $(cell).find('input').width(maxWidth);
                    });
                });

                // Grab the new edited data
                var data = cell.find('input').val();

                // Grab the column heading
                var col = this.table.GetReader().GetHeading(cell);

                // Grab the row number or id of the row if it has one.
                var row: number;
                if (cell.parents('ul[id]').length == 1)
                {
                    // The assumption is that this ID will reflect the same ID
                    // used on the server in the database. This is how I setup
                    // my transparency directives anyway.
                    row = parseInt(cell.parents('ul[id]').attr('id'));
                }
                else
                {
                    // This will be a 0 based number of the row
                    row = this.container.find('.tbody').find('ul').index
                    (
                        cell.parents('ul')
                    );
                }

                // Run any OnEdit callbacks
                this.onEditCallBacks.forEach(function(callback)
                {
                    callback(row, col, data, cell);
                });
            }).bind(this), this.deBounceWait);

            // Remember that we are tied to the ctrl+s keyboard shortcut.
            // So we return false to prevent the browser form performing
            // it's default action.
            return false;
        }

        /**
         * Updates the given inputs width to reflect it's content.
         *
         * @credit https://github.com/MartinF/jQuery.Autosize.Input
         */
        protected SetWidthOfInput(index: number, input: Element): void
        {
            // Copy the "font" styles from the input to the mirror.
            //
            // > NOTE: We do need to do this everytime because it is possible
            // > some fields could have different styles.
            $.each
            (
                [
                    'fontFamily', 'fontSize', 'fontWeight',
                    'fontStyle', 'letterSpacing', 'textTransform',
                    'wordSpacing', 'textIndent'
                ],
                (function (key, val)
                {
				    this.mirror[0].style[val] = $(input).css(val);
			    }).bind(this)
            );

            // Copy the text from the input into mirror
            this.mirror.text($(input).val());

            // Grab the widths of the mirror and the input
            var inputWidth = $(input).width();
            var mirrorWidth = this.mirror.width();

            // Only update the width of the input if it's
            // contents is larger than it's current width.
            if (inputWidth < mirrorWidth)
            {
                // Usual deal, IE needs some extra padding.
                mirrorWidth = mirrorWidth + 5;

                $(input).width(mirrorWidth);
            }
        }
    }

    export interface OnEditCallback
    {
        (
            row: number,
            col: string,
            value: string,
            cell: JQuery
        ): void;
    }
}
