declare module SexyTable {
    /**
     * If set to true we will search for all sexy tables at dom ready and run
     * the automatic width calculations. And then we will show the table.
     */
    var AutoMakeSexy: boolean;
}
declare module SexyTable {
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
    class Editor {
        protected table: Table;
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;
        /**
         * An array of callbacks, that will be run upon a cell being edited.
         */
        protected onEditCallBacks: OnEditCallback[];
        /**
         * Registers the editor events.
         */
        constructor(table: Table);
        /**
         * Registers an OnEdit Callback.
         *
         * > NOTE: To be clear this is called after the cell
         * > has been edited and saved.
         */
        OnEdit(callBack: OnEditCallback): void;
        /**
         * Not all cells in the table should be editable.
         * Given a cell this will tell us if we are allowed to edit it or not.
         */
        protected IsCellEditable(cell: JQuery): boolean;
        /**
         * Shows a prompt to the user to double click on the cell to edit it.
         */
        protected ShowEditPrompt(event: JQueryEventObject): void;
        /**
         * Removes the edit prompt when the mouse leaves the cell.
         *
         * > NOTE: We can't animate the remove (or more to the point I can't be
         * > bothered right now) because when the double click event happens
         * > it will also call this method to ensure the edit prompt is removed
         * > before grabing the cells text content.
         */
        protected HideEditPrompt(event: JQueryEventObject): void;
        /**
         * This will run when any cell is double clicked.
         */
        protected OnCellDbClick(event: JQueryEventObject): void;
        /**
         * This will grab the contents of the input field
         * and place it back directly inside the cell.
         *
         * > NOTE: This does not send any data back to the server!
         * > You must do this yourself with the Reader.
         */
        protected OnSave(cell: JQuery): void;
    }
    interface OnEditCallback {
        (row: number, col: string, value: string, cell: JQuery): void;
    }
}
declare module SexyTable {
    /**
     * Adds filter controls for each column of the table.
     */
    class Filterer {
        protected table: Table;
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;
        /**
         * Give us the tables top level container element.
         * And we will add some sort controls to the tables first row.
         */
        constructor(table: Table);
        ResetFilters(): void;
        /**
         * Filterable tables rely on the thead and tbody containers!
         */
        protected EnsureTableHasThead(): void;
        /**
         * This will add a second row to the thead container.
         * The row will house a text box per column.
         */
        protected InsertFilterInputs(): void;
        /**
         * Callback for each filters keyup event.
         */
        protected OnFilter(filter: Element): void;
    }
}
declare module SexyTable {
    /**
     * Ties a SexyTable to a Server Backend.
     */
    class Pager {
        protected table: Table;
        protected nextCb: Function;
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;
        /**
         * If the pager loads the first page this will get set to true.
         * So that we can do table initialisation stuff.
         */
        protected FirstPage: boolean;
        /**
         * A row counter used so the server knows the number of records to skip.
         */
        protected rows: number;
        /**
         * An object the represents the current sort state.
         */
        protected sort: Object;
        /**
         * A flag to donote when we have reached the end of a result set.
         */
        protected atEnd: boolean;
        /**
         * An object that represents the current search state.
         */
        protected search: Object;
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        constructor(table: Table, nextCb: Function);
        /**
         * Our tables are sexy, we do not use old fashioned clunky next and
         * back buttons. We attach ourselves to the windows on scroll event.
         * Once we detect the user has reachedf the end of the page we will
         * attempt to load more rows into the table.
         *
         * > NOTE: Fancy animations and other loading effects are not provided.
         * > It is up to you to do this in the Pagers nextCb.
         *
         * > TODO: Cater for situations where the table is inside a scrollable
         * > div, instead of the entire window.
         */
        protected OnScroll(): void;
        /**
         * If the table is sortable this will fire when a new sort is performed.
         */
        protected OnSort(column: any, direction: any): void;
        /**
         * If the table is searchable / filterable this will fire
         * when a new search is performed.
         */
        protected OnSearch(column: any, terms: any): void;
        /**
         * Sets up and calls the Next Callback.
         */
        protected GetNext(): void;
        /**
         * Runs when the nextCb calls us, normally after the success of an
         * AJAX request. The response Object is expected to match up with
         * the transparency data bind template.
         */
        protected OnResponse(response: Object): void;
    }
}
declare module SexyTable {
    class Reader {
        protected table: Table;
        /**
         * A shortcut to the tables container.
         */
        private container;
        /**
         * An array of column headings.
         * We use this to build each object that represents a row in the table.
         */
        protected headings: Array<string>;
        GetHeadings(): Array<string>;
        /**
         * The final serialized representation of the table.
         */
        protected serialized: Array<Object>;
        GetSerialized(): Array<Object>;
        /**
         * A copy of the table as it was first serialized.
         * This is very useful for resertting the table to it's orginal state
         * after sorting / filtering / searching actions have taken place.
         */
        protected original: Array<Object>;
        GetOriginal(): Array<Object>;
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        constructor(table: Table);
        /**
         * Serialize's the DOM into a JSON Like Object.
         *
         * > NOTE: Instead of calling this method everytime you may call this
         * > once. And then call GetSerialized() which will in effect cache the
         * > results for you.
         */
        Serialize(updateOriginal?: boolean): Array<Object>;
        /**
         * Returns a JSON string representation of the table ready to be sent
         * via AJAX. Basically this removes the _dom and _guid properties.
         */
        ToJson(cache?: boolean): string;
        /**
         * If the table uses a thead container we will extract the actual
         * column heading names. If not we just create some generic column
         * headings.
         */
        protected ExtractHeadings(): Array<string>;
        /**
         * Creates the Object that represents a Table Row
         * and adds it the Serialized Array.
         */
        protected AddRow(rowNo: any, row: any): void;
        /**
         * Creates a GUID.
         *
         * @see http://goo.gl/8XDeuU
         */
        protected CreateGuid(): string;
        /**
         * Given a particular cell from the table,
         * we will update the serialized state.
         */
        UpdateOriginal(cell: JQuery): void;
        /**
         * Given a cell of the table, this will return the column heading.
         */
        GetHeading(cell: JQuery): string;
    }
}
declare module SexyTable {
    class Searcher {
        protected table: Table;
        /**
         * A shortcut to the tables container.
         */
        protected container: JQuery;
        /**
         * The main lunr.js index. Use for global searches.
         *
         * @see http://lunrjs.com/
         */
        protected index: lunr.Index;
        /**
         * The per column lunr.js index. Use for column specific searches.
         *
         * @see https://goo.gl/1Ao45P
         */
        protected perColIndex: lunr.Index;
        /**
         * Instead of using Lunr for searching, we can hookup the Searcher
         * to a server backend. See the "Pager" for more details about working
         * with a server backend.
         */
        protected serverCb: Function;
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        constructor(table: Table);
        /**
         * Searchable tables rely on the thead and tbody containers!
         */
        protected EnsureTableHasThead(): void;
        /**
         * Tells us to redirect all search requests to your callback.
         * Lunr.js is no longer used for searching. See the "Pager" for more
         * details about working with a server backend.
         *
         * > TODO: When the Searcher is told to use a searcher backend
         * > it still requires Lunr.js to be loaded. Need to move the dependancy
         * > check to somewhere later on in the pipeline.
         *
         * > NOTE: I have had ideas about some sort of hybrid client side and
         * > server side searching solution, where the lunr search would be
         * > used as a cache of sorts but I haven't had a chance to develop my
         * > thoughts any further.
         */
        UseServer(serverCb: Function): void;
        /**
         * Using Lunr.js we search the Table for the supplied Terms.
         *
         * If the column is set to "all" we search all columns.
         * Otherwise this needs to be the snake case name of the column.
         * ie: first_name or col_1 depending on how the table is serialized.
         *
         * To reset the table supply a null or empty search term.
         */
        Query(terms: string, column?: string): void;
        /**
         * Build 2 indexes of the table.
         *
         *   - We use one for global searches across the entire table.
         *   - We use a second for searches specific to a column.
         *
         * @see https://goo.gl/1Ao45P
         */
        BuildIndexes(): void;
        /**
         * Builds the Lunr Index Schema for both indexes.
         */
        protected BuildIndexSchema(): lunr.Index;
    }
}
declare module SexyTable {
    /**
     * This is what emulates the auto sizing features of a normal HTML <table>.
     */
    class Sizer {
        protected table: Table;
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;
        /**
         * Give us the tables top level container element.
         * And we will make ensure it's rows & cells are sized correctly.
         */
        constructor(table: Table);
        /**
         * When a table is updated with new data we will need to make sure it's
         * sized correctly. This is used by the Writer and may be used directly
         * at anytime if required.
         */
        ForceResize(): void;
        /**
         * Even after all our fancy resizing we still end up with the last
         * column being too big and overflowing or not bigger enough and
         * leaving some spare space unallocated.
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
         * Anyway this method will apply one last resize of the last column
         * in the table to ensure everything fits... hopefully :)
         */
        protected FixLastColumn(): void;
        /**
         * In the event the last column is too wide to fit into
         * the table this will shrink it so that it hopefully fits.
         *
         * > NOTE: There is a small range of widths between the minimum size of
         * > the table and when the table container is set to 100% width that
         * > IE still fails and displays a broken table. ITS MOST ANNOYING!!!
         */
        protected DecreaseLastColumn(rescurse?: number): boolean;
        /**
         * The counter part to DecreaseLastColumn.
         * In Chrome I have found that the last column is actually too small
         * sometimes. This will smartly add extra width to the last column
         * so that it takes up all avaliable space.
         */
        protected IncreaseLastColumn(): void;
        /**
         * Loops through all rows in the table and sets their height.
         */
        protected SetHeightOfRows(): void;
        /**
         * Given a UL row element this will loop through all it's LI cells
         * and calculate the rows maximum height.
         */
        protected CalculateRowHeight(row: Element): number;
        /**
         * Sets the width of each of the columns in the table.
         * This turned out to be much more complex that I first thought.
         * This method does have some duplicated code and I'm sure it's not as
         * efficent as it could be but for now it works.
         *
         * > TODO: At some point refactor this and code for performance.
         */
        protected SetWidthOfColumns(): void;
        /**
         * Counts the number of columns in the table that
         * still have space to spare and can be resized.
         */
        protected GetResizeableCols(): number;
        /**
         * Gets the inner widths of all cells in the provided column.
         * Performs some basic calcs on the widths and returns an object
         * for easy access to the results.
         */
        protected GetColWidths(col: Array<Element>): ColWidths;
        /**
         * To make sure we don't overflow any rows of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all rows of the table.
         */
        protected GetRowBorder(): number;
        /**
         * In some css layouts you may like to add horizontal padding to rows.
         * Creating a frame and inseting the actual table contents.
         * This method calculates that padding if applied.
         *
         * > NOTE: We assume the same padding has been applied to all rows.
         */
        protected GetRowPadding(): number;
        /**
         * To make sure we don't overflow any cells of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all cells of the table.
         */
        protected GetColumnBorder(): number;
        /**
         * Gets the number of columns in the table.
         *
         * > NOTE: At the this stage the equivalent of colspans are not
         * > supported. The first UL row in the table is assumed to have
         * > the same number of LI cells as the rest of the table.
         */
        protected GetNumberOfCols(): number;
        /**
         * After all sizing functions have taken place, it's safe to show the
         * table, knowing it won't look like a dogs breakfast, regurgitated.
         */
        protected UnhideContainer(): void;
    }
    interface ColWidths {
        widths: Array<number>;
        min: number;
        max: number;
        diff: number;
    }
}
declare module SexyTable {
    /**
     * Adds sorting controls to the first row of the table.
     *
     * > NOTE: We assume font awesome icons are avaliable.
     */
    class Sorter {
        protected table: Table;
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;
        /**
         * Makes the natural sort algorithm ignore case.
         */
        protected caseInsensitive: boolean;
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
        constructor(table: Table);
        /**
         * Sortable tables rely on the thead and tbody containers!
         */
        protected EnsureTableHasThead(): void;
        /**
         * Tells us to redirect all sort requests to your callback.
         * The natural sort alograthim included in the class is no longer used.
         * See the "Pager" for more details about working with a server backend.
         */
        UseServer(serverCb: Function): void;
        /**
         * In some cases, other features such as the Searcher may redraw the
         * table with new rows. And thus any sorting UI needs to be reset to
         * default.
         */
        ResetSortIcons(): void;
        /**
         * Given a set of rows we will sort them. This is used by the Searcher
         * to sort a set of matches using the current sort state.
         *
         * > TODO: Refactor the sorter to cache the current sort state.
         */
        Sort(rows: Array<Object>): Array<Object>;
        /**
         * This will create an <i> element for each thead cell.
         * The <i> element will be given apprioriate Font Awesome icon classes.
         * Thus it's important that Font Awesome is loaded when using sortable
         * tables. No checks are done you just won't see any sort icons if you
         * forget to include Font Awersome.
         */
        protected InsertSortableToggles(): void;
        /**
         * Callback for the thead cells click event.
         */
        protected OnSort(cell: Element): void;
        /**
         * Given a column we will sort the table based on that column.
         */
        protected SortTable(cell: Element, reverse?: boolean): Array<Object>;
        /**
         * Allows us to sort by an objects key.
         */
        protected sortByKey(key: any): (a: any, b: any) => number;
        /**
         * Natural Sort algorithm for Javascript
         *
         * @author Jim Palmer (based on chunking idea from Dave Koelle)
         * @see https://github.com/overset/javascript-natural-sort
         */
        protected naturalSort(a: any, b: any): number;
    }
}
declare module SexyTable {
    /**
     * Represents a Single SexyTable.
     */
    class Table {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;
        GetContainer(): JQuery;
        /**
         * The instance of the Reader for this Table.
         */
        protected reader: Reader;
        GetReader(): Reader;
        HasReader(): boolean;
        /**
         * The instance of the Writer for this Table.
         */
        protected writer: Writer;
        GetWriter(): Writer;
        HasWriter(): boolean;
        /**
         * The instance of the Sizer for this Table.
         */
        protected sizer: Sizer;
        GetSizer(): Sizer;
        HasSizer(): boolean;
        /**
         * The instance of the Sorter for this Table.
         */
        protected sorter: Sorter;
        GetSorter(): Sorter;
        HasSorter(): boolean;
        /**
         * The instance of the Sorter for this Table.
         */
        protected searcher: Searcher;
        GetSearcher(): Searcher;
        HasSearcher(): boolean;
        /**
         * The instance of the Sorter for this Table.
         */
        protected filterer: Filterer;
        GetFilterer(): Filterer;
        HasFilterer(): boolean;
        /**
         * The instance of the Pager for this Table.
         */
        protected pager: Pager;
        GetPager(): Pager;
        HasPager(): boolean;
        /**
         * The instance of the Editor for this Table.
         */
        protected editor: Editor;
        GetEditor(): Editor;
        HasEditor(): boolean;
        /**
         * Give us the tables top level container element.
         * Eg: <div class="sexy-table"></div>
         */
        constructor(table: Element | JQuery);
        /**
         * Creates a new Editor for the table.
         */
        MakeEditable(): void;
        /**
         * Creates a new Pager for the table.
         * This allows the table to interact with a server backend.
         */
        MakePageable(nextCb: Function): void;
        /**
         * Create a new Writer for the table.
         * This will allow tables to be created at runtime from JSON,
         * instead of existing HTML Markup.
         */
        MakeWriteable(): void;
        /**
         * Each LI element represents a cell of the table.
         * However for various styling reasons we need to insert an inner
         * container. Unsemantic markup is one of my pet hates thus we do
         * this using javascript.
         */
        InsertCellWrapper(): void;
        /**
         * Programatically make a table sortable.
         */
        MakeSortable(): void;
        /**
         * Programatically make a table searchable.
         */
        MakeSearchable(): void;
        /**
         * Programatically make a table filterable.
         */
        MakeFilterable(): void;
        /**
         * Given an array of either serialized rows as created by the Reader.
         * Or an array of DOM Elements, this will empty the contents of the
         * tables tbody container and recreate it with the suppplied table rows.
         */
        Redraw(rows: Array<any>, reSerialize?: boolean): void;
        /**
         * Quick shortcut to reset the table back to it's original
         * state before any sorting, searching, filtering, etc...
         */
        Reset(): void;
        /**
         * When new data has been added to the table,
         * you may call this to rerun the table initialisation.
         */
        Refresh(): void;
        /**
         * Grabs all rows from the table.
         */
        GetRows(): JQuery;
        /**
         * Grabs all cells in the table.
         */
        GetCells(): JQuery;
        /**
         * Creates a multi-dimensional array with all cells
         * from the table grouped by column.
         */
        GetColumns(): Array<Array<Element>>;
    }
}
declare module SexyTable {
    class Writer {
        protected table: Table;
        /**
         * A shortcut to the tables container.
         */
        protected container: JQuery;
        /**
         * These will be passed on to transparency.js
         *
         * You may set these globally here or you pass in custom
         * directives to either Append or Replace methods.
         *
         * @see https://github.com/leonidas/transparency#directives
         */
        protected directives: Object;
        GetDirectives(): Object;
        SetDirectives(value: Object): void;
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        constructor(table: Table);
        /**
         * Appends data to the table, then re-initialises the table.
         */
        Append(viewmodel: Object, directives?: Object): void;
        /**
         * Replaces the current data in the table with this new data.
         */
        Replace(viewmodel: Object, directives?: Object): void;
        /**
         * Moves the Data Bind Template.
         *
         * If we leave the template as it is as part of the tbody container.
         * We can't render new rows into the table, as whatever data we pass to
         * the View Framework will override what already exists.
         *
         * > NOTE: This is the case with transparency.js ast least I can't
         * > comment for others but I am making an assumption they will be
         * > similar.
         *
         * Therefore we move the template and hide it too.
         * Then we can render new results into the template and append them
         * into tbody. We can do this as many times as we like.
         */
        protected CreateDataBindTemplate(): void;
    }
}