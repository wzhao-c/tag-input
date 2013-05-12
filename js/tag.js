;(function(window, $, undefined) {
    'use strict';
    
    /*!
     * Tag Model
     */
    function Tag(data) {
        this.text = '';
        this.link = '#';
        
        // Load the tag's information
        this.load(data);
    }    
    
    Tag.Text = {
        MAX: 10,
        MIN: 2
    };
    
    Tag.prototype = {
        /*!
         * Method to load
         * \return object
         */
        load: function(data) {
            var self = this;            
            
            if ($.isPlainObject(data) && !$.isEmptyObject(data)) {
                $.each(data, function(prop, value) {
                    if (self.hasOwnProperty(prop) && value != '') {
                        self[prop] = value;
                    }
                });
            }
            
            if ($.type(data) === 'string' || $.type(data) === 'number' ) {
                self.text = $.trim(data);
            }
        },
        
        /*!
         * Method to build the single tag jQuery object
         * \return string || null
         */
        buildHTML: function() {
            var self = this,
                html = '';
            
            if (self.text) {
                html += '<a ';
                html += 'data-text="' + self.text + '" ';
                html += '>';
                html += self.getText() + '<span class="input-tag-close"><i>x</i></span>';
                html += '</a>';
                
                return html;                
            }
            
            return null;
        },
        
        /*!
         * Method to set the current link
         * \param string url
         * \param isAbsoluteLink
         * \return object
         */
        setLink: function() {
            var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
            var url = arguments[0] || null;
            var isAbsoluteLink = arguments[1] || false;
            
            if ($.type(url) !== 'string') {
                throw new Error('Please include a vailid url.');
            }
            
            if (isAbsoluteLink) {
                if (!regexp.test(url)) {
                    throw new Error('Please include an absolute url.');
                }
            }
            
            this.link = url;
            return this;
        },
        
        /*!
         * Method to get the tag's text
         * \return string
         */
        getText: function() {
            // Trim the text
            var text = $.trim(this.text);
            
            // Limit the text length
            return (text.length > Tag.Text.MAX) ? text.slice(0, (Tag.Text.MAX - 3)) + '...' : text;
        },
        
        /*!
         * Method to get width of the tag's text
         * \return int
         */
        getTextWidth: function(font) {
            var body = $(document.body),
                textHTML = '<span>' + this.getText() + '</span>',
                textWrap = body.append(textHTML).find('span:last'),
                _font = {
                    'font-family': 'Arial',
                    'font-size': 12
                };
            
            if (font && $.type(font) === 'object') {
                $.extend(_font, font);
            }
            
            // Apply font CSS to the text and get the width
            var width = textWrap.css(_font).width();
            
            // Clean up the temp HTML code.
            body.find('span:last').remove();
            return width;
        }
    }
    
    var Config, CallMethods, Keys, EventActions;
    
    // Default settings and classes
    Config = {
        settings: {
            wrapperWidth:      300,
            contentWidth:      260,
            minInputWidth:     60,
            rowHeight:         30,
            numRows:           3,
            
            // For row width calculation
            tagFontSize:       12,
            tagFontFamily:     'Arial',
            tagPadding:        [0, 5, 0, 5], // top, rgt, btm, lft
            tagBorder:         1,
            tagSpace:          6, // ul li margin-right
            closeSize:         [12, 12], // width, height
            closePadding:      [0, 0, 0, 5], // top, rgt, btm, lft
            
            placeHolder:       '',
            
            callUrl:           '',
            callMethod:        '',
            localStore:        false,
            
            onTagAdded:        $.noop,
            onTagRemoved:      $.noop,
            onSearchCompleted: $.noop
        },
        
        classes: {
            content:   '.input-tag-content',
            input:     '.input-tag-input',
            searchBtn: '.input-tag-search',
            closeBtn:  '.input-tag-close'
        }
    }
    
    // Constants
    CallMethods = {
        GET:  'get',
        POST: 'post'
    }
    
    Keys = {
        DELETE:    8,
        BACKSPACE: 46,
        ENTER:     13,
        UP:        38,
        DOWN:      40
    }
    
    EventActions = {
        CLICK:   'click',
        DBCLICK: 'dblclick',
        KEYDOWN: 'keydown',
        KEYUP:   'keyup',
        SUBMIT:  'submit'
    }
    
    // Public methods
    var Methods = {
        /*!
         * Method to import the data to tag object, store it to the data.tags
         * \param array||object source
         * \return void
         */
        importData: function(source) {
            return this.each(function() {
                var self = this,
                    $this = $(this),
                    data = $this.data('taginput') || {},
                    _type = $.type(source);
                
                if ((_type == 'array' || _type == 'object') && data) {
                    $.each(source, function() {
                        var _tag = new Tag(this);
                        
                        if (!checkTagExist.call(self, _tag.text)) {
                            data.tags.push(new Tag(this));
                        }
                    });
                    
                    renderTagRows.call(this);
                    resetUI.call(this);
                } else {
                    $.error( 'Error occurs' );
                }
            });
        },
        /*!
         * Method to unset the current data
         * \return void
         */
        destory: function() {
            return this.each(function() {
                var $this = $(this);
                
                // Destory all the data
                $this.removeData('taginput');
            });
        }
    }
    
    // Private methods
    function init(config) {
        return this.each(function() {
            var $this = $(this),
                data = $this.data('taginput');
            
            if (!data) {
                $this.data('taginput', {
                    config: $.extend(true, Config, config),
                    tags: [] // Array of Tag objects
                });
                
                data = $this.data('taginput');
            }
            
            bindEvents.apply(this);
        });
    }
    
    function bindEvents() {
        var self = this,
            $this = $(this),
            data = $this.data('taginput'),
            classes = data.config.classes;        
        
        $this.on(EventActions.CLICK, classes.closeBtn, function(e) {                
            deleteTag.call(self, $(this).closest('a').data('text'));
            e.preventDefault();
        });
        
        $this.on(EventActions.KEYDOWN, classes.input, function(e) {
            var keycode =  e.keyCode ? e.keyCode : e.which;
                
            // Delete the last tag if user press delete or backspace
            if (keycode === Keys.DELETE || keycode === Keys.BACKSPACE) {
                // Check if the input field is empty
                if (!$(this).val()) {
                    deleteTag.call(self, $(this).prev('ul').find('li:last a').data('text'));
                    e.preventDefault();
                }
            }
            
            // User hit the enter
            if (keycode === Keys.ENTER) {
                
            }
        });
        
        // Test
        $this.on(EventActions.CLICK, classes.searchBtn, function(e) {
            e.preventDefault();
            insertTag.call(self, Math.ceil(Math.random()*9999));
        });
    }

    /*!
     * Method to insert a tag
     * \param string text
     * \return void
     */
    function insertTag(tag) {
        var $this = $(this),
            data = $this.data('taginput'),
            classes = data.config.classes,
            _tag = new Tag(tag);
            
        if (_tag.text && !checkTagExist.call(this, _tag.text)) {            
            data.tags.push(_tag);
        }
        
        renderTagRows.call(this);
        resetUI.call(this);
    }
    
    /*!
     * Method to unset the seleted tag from tags array, then rerender the tags list
     * \param string text
     * \return void
     */
    function deleteTag(text) {
        var $this = $(this),
            data = $this.data('taginput');        
        
        if (text) {
            // Unset the tag
            data.tags = $.grep(data.tags, function(tag) {
                return tag.text != text;
            });
            
            renderTagRows.call(this);
            resetUI.call(this);
        }
    }
    
    /*!
     * Method to check if the tag exists
     * \param string text
     * \return bool
     */
    function checkTagExist(text) {
        var $this = $(this),
            data = $this.data('taginput'),
            result = false;
        
        $.each(data.tags, function() {
            if (this.text == text) {
                result = true;
            }
        });            
        
        return result;
    }
    
    function resetUI() {
        var $this = $(this),
            data = $this.data('taginput'),
            classes = data.config.classes,
            settings = data.config.settings,
            $input = $this.find(classes.input),
            $content = $this.find(classes.content),
            currentNumRows = parseInt($this.height() / settings.rowHeight),
            lastRowWidth = $content.find('ul').eq(-1).outerWidth(),
            latestNumRows = $content.find('ul').length || 1;
        
        // If input field is lower than the last tag row, add the input height to the total height
        if (settings.contentWidth - lastRowWidth < settings.minInputWidth) {
            $input.css('width', '80%');
            latestNumRows++;
        } else {
            $input.css('width', (settings.contentWidth - lastRowWidth)).appendTo($content);
        }
        
        if (latestNumRows != currentNumRows) {
            $this.animate({ height: (((latestNumRows > settings.numRows) ? settings.numRows : latestNumRows) * settings.rowHeight) }, 200);
        }
        
        focusInput.call(this);
        //applyStyle.call(this);
    }
    
    /*!
    * Function to display the tag rows
    * \return void
    */
    function renderTagRows() {
        var $this = $(this),
            data = $this.data('taginput'),
            settings = data.config.settings,
            tagWrapWidth = settings.tagPadding[3] + settings.tagPadding[1] + settings.tagBorder * 2 + settings.tagSpace + 
                           settings.closePadding[3] + settings.closePadding[1] + settings.closeSize[0],
            currentRowWidth = 0,
            currentRowEls = [],
            html = '';        
        
        // Remove tag rows
        removeTagRows.call(this);
        
        if (data.tags.length > 0) {
            $.each(data.tags, function() {
                // Get current tag width and tag HTML
                var _elWidth = this.getTextWidth({ 'font-family': settings.tagFontFamily, 'font-size': settings.tagFontSize }) + tagWrapWidth,
                    _elHtml = this.buildHTML();
                
                // Add to the current row width
                currentRowWidth += _elWidth;
                currentRowEls.push('<li>' + _elHtml + '</li>');                
                
                if (currentRowWidth > settings.contentWidth) {
                    // Remove the current element
                    currentRowEls.pop();
                    
                    // Build the row html
                    html += buildTagRow(currentRowEls);
                    
                    // Reset the row width and elements
                    currentRowWidth = _elWidth;                        
                    currentRowEls = ['<li>' + _elHtml + '</li>'];
                }
                
                // If current tag is the last element in tags array                
                if (this == data.tags[data.tags.length - 1]) {                    
                    html += buildTagRow(currentRowEls);
                }
            });
            
            // Display the tag rows to the content
            $this.find(data.config.classes.content).prepend(html);
        }
    }
    
    function removeTagRows() {
        var $this = $(this),
            data = $this.data('taginput'),
            classes = data.config.classes;
        
        $this.find(classes.content).find('ul').remove();
    }
    
    /*!
     * Method to apply the CSS style
     * \return void
     */
    function applyStyle() {
        var $this = $(this),
            data = $this.data('taginput'),
            classes = data.config.classes,
            settings = data.config.settings,
            $content = $this.find(classes.content);
        
        $content.find('li').css({
            'marginRight':  settings.tagSpace
        }).find('a').css({
            'padding':      settings.tagPadding.join('px ') + 'px',
            'border-width': settings.tagBorder
        }).find('span').css({
            'padding':      settings.closePadding.join('px ') + 'px'
        }).find('i').css({
            'width':        settings.closeSize[0],
            'height':       settings.closeSize[1]
        });
    }
    
     /*!
     * Method to focus to the input field
     * \return void
     */
    function focusInput() {
        var $this = $(this),
            data = $this.data('taginput');
        
        $this.find(data.config.classes.input).focus();
    }
    
    /*!
    * Function to generate the single tag row
    * \param object|string tagsHTML
    * \return string
    */
    function buildTagRow(rowHTML) {
        var html = '';
        
        if ($.type(rowHTML) === 'string') { html = rowHTML; }
        if ($.type(rowHTML) === 'array') { html = rowHTML.join(''); }
        
        return (html) ? '<ul>' + html + '</ul>' : '';            
    }
    
    /*!
    * Function to save search results to the session storage
    * \param string q
    * \param string|array content
    * \return void
    */
    function saveToLocalStorage(q, content) {
        var key = $.trim(q),
            val = null
            type = $.type(content);
        
        if (type === 'array' || type === 'object') {
            val = JSON.stringify(content);
        }
        if (type === 'string') {
            val = content;
        }
        
        if (val) {
            sessionStorage.setItem(key, val);
        }
    };
    
    
    $.fn.tagInput = function(method) {
        if (Methods[method]) {
            return Methods[method].apply( this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return init.apply(this, arguments);
        } else {
            $.error( 'Method \'' +  method + '\' does not exist on jQuery.tagInput' );
        }
    }
    
    var tester = $('.test1');
    // Init
    tester.tagInput();
    // Import the data
    tester.tagInput('importData', ['text1', 'text2', 'text3']);
    
    
    var tester2 = $('.test2');    
    tester2.tagInput();
    tester2.tagInput('importData', ['text1', 'text2', 'text3', 'text4', 'text5', 'text6', 'text7', 'text8', 'text9', 'text10']);

    /*!
     *TODO
     * Method to search the users
     * \If 'term' exists in the session storage, return the value.
     * \Otherwise we call the api.
     * 
     * \param string term
     * \return void
     */
    //function doSearch(term) {
    //    var self = this,
    //        _term = $.trim(term) || null;
    //    var onSearchCompleted = self.config.onSearchCompleted, // Callback function
    //        promised = null; // Deferred object
    //    
    //    if (_term) {
    //        // Read the saved the search results from session storage
    //        if (self.config.localStore && (returns = sessionStorage.getItem(_term))) {
    //            promised = function() {
    //                var dfd = new $.Deferred(),
    //                    _users = JSON.parse(returns);                    
    //                
    //                // Cache the array of users obj
    //                self.cacheUsers(_users);
    //                
    //                // Resolve the deferred object
    //                dfd.resolve();
    //                return dfd.promise();
    //            }();
    //        } else {
    //            $.ajax({
    //                type: 'POST',
    //                url: self.config.url,
    //                data: { name: "John", location: "Boston" }
    //            });
    //            
    //            promised = call.api(self.config.url, { term: _term }, function(data) {
    //                if (data.status.code === 2000 && $.type(data.users) === 'array') {
    //                    // Store it to the sessionStorage
    //                    if (self.config.localStore) {
    //                        self.saveToLocalStorage(_term, data.users);
    //                    }
    //                    
    //                    // Cache the array of users obj
    //                    self.cacheUsers(data.users);
    //                }
    //            });
    //        }
    //    }
    //    
    //    // Callback
    //    promised.done(function() {
    //        // Do callback function
    //        if (onSearchCompleted && $.type(onSearchCompleted) === 'function') {
    //            onSearchCompleted.call(self);
    //        }
    //    });
    //}
})(window, jQuery);

