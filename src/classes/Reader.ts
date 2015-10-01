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
    export class Reader
    {
        /**
         * A shortcut to the tables container.
         */
        private container: JQuery;

        /**
         * An array of column headings.
         * We use this to build each object that represents a row in the table.
         */
        protected headings: Array<string>;
        public GetHeadings(): Array<string>
        {
            return this.headings;
        }

        /**
         * The final serialized representation of the table.
         */
        protected serialized: Array<Object>;
        public GetSerialized(): Array<Object>
        {
            return this.serialized;
        }

        /**
         * A copy of the table as it was first serialized.
         * This is very useful for resertting the table to it's orginal state
         * after sorting / filtering / searching actions have taken place.
         */
        protected original: Array<Object>;
        public GetOriginal(): Array<Object>
        {
            return this.original;
        }

        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.original = this.Serialize().slice(0);
        }

        /**
         * Serialize's the DOM into a JSON Like Object.
         *
         * > NOTE: Instead of calling this method everytime you may call this
         * > once. And then call GetSerialized() which will in effect cache the
         * > results for you.
         */
        public Serialize(updateOriginal = false): Array<Object>
        {
            this.serialized = [];

            this.headings = this.ExtractHeadings();

            if (this.container.find('.tbody').length == 0)
            {
                this.container.find('ul').each(this.AddRow.bind(this));
            }
            else
            {
                this.container.find('.tbody ul').each(this.AddRow.bind(this));
            }

            if (updateOriginal) this.original = this.serialized.slice(0);

            return this.serialized;
        }

        /**
         * Returns a JSON string representation of the table ready to be sent
         * via AJAX. Basically this removes the _dom and _guid properties.
         */
        public ToJson(cache = true): string
        {
            var data, jsonArray = [];

            if (cache)
            {
                data = this.serialized;
            }
            else
            {
                data = this.Serialize();
            }

            for (var i = 0; i < data.length; i++)
            {
                var row = {};

                for (var key in data[i])
                {
                    if (key != '_dom' && key != '_guid')
                    {
                        row[key] = data[i][key];
                    }
                }

                jsonArray.push(row);
            }

            return JSON.stringify(jsonArray);
        }

        /**
         * If the table uses a thead container we will extract the actual
         * column heading names. If not we just create some generic column
         * headings.
         */
        protected ExtractHeadings(): Array<string>
        {
            var headings = [];

            if (this.container.find('.thead').length == 0)
            {
                // We have no thead so lets just use numeric headings
                var cols = this.container.find('ul').first().find('li').length;
                for (var i = 0; i < cols; i++) headings.push("col_" + i);
            }
            else if (this.table.HasWriter())
            {
                // The table has a data binding template so lets
                // use the data-bind values as our heading names.
                this.container.find('.data-bind-template ul').first().find('li')
                .each(function(index, el)
                {
                    var heading = <any>$(el).data('bind');
                    if (heading === undefined) heading = "";
                    headings.push(heading);
                });
            }
            else
            {
                // We do have a thead so lets extract the column headings
                this.container.find('.thead ul').first().find('li').each
                (
                    function(index, cell)
                    {
                        headings.push
                        (
                            $(cell).find('.inner').text()
                            .toLowerCase().replace(" ", "_")
                        );
                    }
                );
            }

            return headings;
        }

        /**
         * Creates the Object that represents a Table Row
         * and adds it the Serialized Array.
         */
        protected AddRow(rowNo, row): void
        {
            var rowData = {}, that = this;

            // Create a GUID for our row. This is used by the Searcher.
            // And is a way to uniquely identify a row without using DOM ID's.
            rowData['_guid'] = this.CreateGuid();

            // Add a reference to the dom. This will be useful
            // when sorting and other dom manipulations.
            rowData['_dom'] = row;

            $(row).find('li').each(function(cellNo, cell)
            {
                // Ignore columns with no heading as these can't hold
                // data. These will normally be columns with other UI
                // elements such as buttons.
                if (that.headings[cellNo] != "")
                {
                    if ($(cell).find('input').length === 1)
                    {
                        rowData[that.headings[cellNo]] = $(cell).find('input').val();
                    }
                    else
                    {
                        rowData[that.headings[cellNo]] = $(cell).find('.inner').text();
                    }
                }
            });

            this.serialized.push(rowData);
        }

        /**
         * Creates a GUID.
         *
         * @see http://goo.gl/8XDeuU
         */
        protected CreateGuid(): string
        {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace
            (
                /[xy]/g,
                function(c)
                {
                    var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                }
            );
        }

        /**
         * Given a particular cell from the table,
         * we will update the serialized state.
         */
        public UpdateOriginal(cell: JQuery): void
        {
            var parent = cell.parents('ul');

            for (var i = 0; i < this.original.length; i++)
            {
                var row = this.original[i];

                if (row['_dom'] === parent[0])
                {
                    var colNo = parent.find('.inner').index(cell);
                    var colHeading = this.headings[colNo];

                    if (cell.find('input').length === 1)
                    {
                        row[colHeading] = cell.find('input').val();
                    }
                    else
                    {
                        row[colHeading] = cell.text();
                    }

                    break;
                }
            }
        }

        /**
         * Given a cell of the table, this will return the column heading.
         */
        public GetHeading(cell: JQuery): string
        {
            return this.headings[cell.parents('ul').find('.inner').index(cell)];
        }
    }
}
