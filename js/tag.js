/**
 * jQuery Tag Input Plugin
 *
 * @version 1.0
 * @author Wei Zhao
 * @date May 22nd, 2013
 * 
 * Copyright 2013, Wei Zhao
 * Released under the MIT license.
 *
 * Dependencies:
 *  jQuery 1.9.1
 */
;(function(window, $, undefined) {
    /*!
     * Tag Model
     */
    function Tag(data) {
        this.text = '';
        this.link = '#';
        this.btn = '&#10005;'; // 'x'
        this.btnClass = '';
        
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
         * 
         * @return object
         */
        load: function(data) {
            var self = this;
            
            if ($.isPlainObject(data) && !$.isEmptyObject(data)) {
                $.each(data, function(prop, value) {
                    if (self.hasOwnProperty(prop) && value !== '') {
                        self[prop] = value;
                    }
                });
            }
            
            if ($.type(data) === 'string' || $.type(data) === 'number') {
                self.text = $.trim(data);
            }
        },
        
        /*!
         * Method to build the single tag jQuery object
         * 
         * @return string || null
         */
        buildHTML: function() {
            var self = this,
                html = '';
            
            if (self.text) {
                html += '<a ';
                if (this.btnClass) {
                    html += 'class="' + self.btnClass + '" ';
                }
                html += 'data-text="' + self.text + '" ';
                html += '>';
                html += self.getText() + '<span class="input-tag-close"><i>' + self.btn + '</i></span>';
                html += '</a>';
                
                return html;                
            }
            
            return null;
        },
        
        /*!
         * Method to set the current link
         * 
         * @param string url
         * @param isAbsoluteLink
         * @return object
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
         * 
         * @return string
         */
        getText: function() {
            // Trim the text
            var text = $.trim(this.text);
            
            // Limit the text length
            return (text.length > Tag.Text.MAX) ? text.slice(0, (Tag.Text.MAX - 3)) + '...' : text;
        }
    };
    
    /*!
     * URL Parameter Model
     */
    function Parameter(term) {
        this.searchTerm = term;
        this.params = {};
    }
    
    Parameter.prototype = {
        addParam: function(name, value) {
            this.params[name] = value;
        },
        removeParam: function(name) {
            delete this.params[name];
        },
        getParams: function() {
            return this.params;
        },
        getTerm: function() {
            return this.searchTerm;
        }
    };
    
    var Config, CallMethods, Keys, EventActions;
    
    // Constants
    CallMethods = {
        GET:  'get',
        POST: 'post'
    };
    
    Keys = {
        DELETE:    8,
        BACKSPACE: 46,
        ENTER:     13,
        UP:        38,
        DOWN:      40
    };
    
    EventActions = {
        CLICK:   'click',
        DBCLICK: 'dblclick',
        KEYDOWN: 'keydown',
        KEYUP:   'keyup',
        SUBMIT:  'submit'
    };
    
    // Default settings
    Config = {
        wrapperWidth:      300,
        contentWidth:      270,
        minInputWidth:     30,
        rowHeight:         30,
        
        placeHolder:       '',
        pendingClass:      'pending',
        
        callURL:           '',
        callMethod:        CallMethods.POST,
        localStore:        true,
        autoSearch:        false,
        
        afterTagAdded:        $.noop,
        afterTagDeleted:      $.noop,
        afterSearchCompleted: $.noop
    };
    
    // Public methods
    var Methods = {
        /*!
         * Method to import the data to tag object, store it to the data.tags
         *
         * @param array||object source
         * @return void
         */
        importData: function(source) {
            return this.each(function() {
                var $this = $(this),
                    data = $this.data('taginput') || {},
                    type = $.type(source);
                
                if ((type === 'array' || type === 'object') && data) {
                    loadTags.call(this, source);
                    
                    renderTags.call(this);
                } else {
                    $.error('Error occurs');
                }
            });
        },
        
        /*!
         * Method to unset the current data
         *
         * @return void
         */
        destory: function() {
            return this.each(function() {
                var $this = $(this);
                
                // Destory all the data
                $this.removeData('taginput');
            });
        }
    };
    
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
            
            // Inintial the CSS
            $this.css({
                'width': data.config.wrapperWidth,
                'height': data.config.rowHeight
            });
            $this.find('div').eq(0).css('width', data.config.contentWidth);
            
            bindEvents.call(this);
        });
    }
    
    function bindEvents() {
        var self = this,
            $this = $(this),
            data = $this.data('taginput');
        
        // Close or Pending button - click
        $this.on(EventActions.CLICK, 'a:not(.' + data.config.pendingClass + ') i', function(e) {
            // Delete the exsiting tag
            deleteTag.call(self, $(this).closest('a').data('text'));
            
            e.preventDefault();
        });
        
        $this.on(EventActions.CLICK, 'a.' + data.config.pendingClass + ' i', function(e) {
            var $a = $(this).closest('a'),
                tag = new Tag($a.data('text'));
            
            var $button = $this.find('button');
            
            if (tag.text && !checkTagExist(data.tags, tag.text)) {
                data.tags.push(tag);
                
                // Change the tag style
                $a.removeClass(data.config.pendingClass).find('i').html(tag.btn);
                
                // Change the button 
                $button.addClass('add');
                
                // Unbind the current tag remove button event
                $this.off(EventActions.CLICK, 'a:not(.' + data.config.pendingClass + ') i');
            }
            
            e.preventDefault();
        });
        
        // Input field - keydown
        $this.on(EventActions.KEYDOWN, 'input', function(e) {
            var keycode =  e.keyCode || e.which;
            var val = $(this).val();
            
            // Delete the last tag if user press delete or backspace
            if (keycode === Keys.DELETE || keycode === Keys.BACKSPACE) {
                // Check if the input field is empty
                if (!val) {
                    deleteTag.call(self, $(this).parent('li').prev().find('a').data('text'));
                    e.preventDefault();
                }
            }
            
            // User hit the enter, add a new tag
            if (keycode === Keys.ENTER) {
                if (val) {
                    insertTag.call(self, val);
                    resetUI.call(self);
                    $(this).val('');
                }
            }
        });
        
        // TODO
        // Input field - keyup
        // for ajax call
        if (data.config.autoSearch) {
            $this.on(EventActions.KEYUP, 'input', function(e) {
                var term = $(this).val(),
                    parameter = new Parameter(term);
                
                delay(function() {
                    //parameter.addParam('q', term);
                    doSearch.call(self, parameter);
                }, 800);
                
                e.preventDefault();
            });
        }
        
        // Search button - click
        $this.on(EventActions.CLICK, 'button', function(e) {
            var $button = $(this),
                term = $this.find('input').val();
            
            // Do search
            if (!$button.hasClass('add')) {
                doSearch.call(self, new Parameter(term));
            // Add the selected tags
            } else {
                $button.removeClass('add');
                
                // Remove all pending tags and reset UI
                removeTags.call(self, true);
                resetUI.call(self);
                
                // TODO
                $this.on(EventActions.CLICK, 'a:not(.' + data.config.pendingClass + ') i', function(e) {
                // Delete the exsiting tag
                    deleteTag.call(self, $(this).closest('a').data('text'));
                    
                    e.preventDefault();
                });
            }
            
            e.preventDefault();
        });
    }
    
    var delay = (function(){
        var timer = 0;
        
        return function(callback, ms){
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        };
    })();
    
    /*!
     * Method to search the users
     * If 'term' exists in the session storage, return the value.
     * Otherwise do ajax call.
     * 
     * @param object parameter
     * @return void
     */
    function doSearch(parameter) {
        var self = this,
            $this = $(this),
            data = $this.data('taginput'),
            returns = '',
            promised = {},
            promised_data = [];
        
        // Remove all pending tags
        removeTags.call(self, true);
        
        if (parameter.getTerm()) {
            if (data.config.localStore && (returns = sessionStorage.getItem(parameter.getTerm()))) {
                promised = function() {
                    var dfd = new $.Deferred();
                    
                    //loadTags.call(self, JSON.parse(returns));
                    promised_data = JSON.parse(returns);
                    
                    // Resolve the dferred obj
                    dfd.resolve();
                    
                    return dfd.promise();
                }();
            } else {
                // call function returns ajax obj
                promised = ajaxCall(data.config.callMethod, data.config.callURL, parameter.getParams()).success(function(ajaxData) {
                    //loadTags.call(self, _data);
                    promised_data = ajaxData;
                    
                    if (data.config.localStore) {
                        saveToLocalStorage(parameter.getTerm(), JSON.stringify(ajaxData));
                    }
                });
            }
            
            // Display all the tags after searching
            promised.done(function() {
                // Display all the tags
                //renderTags.call(self);
                
                if (promised_data) {
                    $.each(promised_data, function() {
                        insertTag.call(self, this, data.config.pendingClass);
                    });
                    
                    resetUI.call(self);
                }
                
                // Callback function
                data.config.afterSearchCompleted.call(self);
            });
        }
    }
    
    /*!
     * Ajax call
     * 
     * @param string method
     * @param string url
     * @param object parameters
     * @return object
     */
    function ajaxCall(method, url, parameters) {
        return $.ajax({
            type: method,
            url:  url,
            dataType: 'json',
            data: parameters
        });
    }
    
    /*!
     * Function to save search results to the session storage
     * 
     * @param string q
     * @param string|array content
     * @return void
     */
    function saveToLocalStorage(q, content) {
        var val = null,
            type = $.type(content);        
        
        if (type === 'array' || type === 'object') {
            val = JSON.stringify(content);
        }
        if (type === 'string') {
            val = content;
        }
        
        if (val) {
            sessionStorage.setItem(q, val);
        }
    }
    
    /*!
     * Method to load tags
     *
     * @param array objs
     * @return void
     */
    function loadTags(objs) {
        var $this = $(this),
            data = $this.data('taginput');
        
        $.each(objs, function() {
            var tag = new Tag(this);
            
            if (!checkTagExist(data.tags, tag.text)) {
                data.tags.push(tag);
            }
        });
    }
    
    /*!
     * Method to insert a tag
     *
     * @param string text
     * @param string type
     * @return void
     */
    function insertTag(tag, type) {
        var $this = $(this),
            data = $this.data('taginput'),
            tagModel = new Tag(tag);
            
        if (tagModel.text && !checkTagExist(data.tags, tagModel.text)) {
            if (type !== data.config.pendingClass) {
                data.tags.push(tagModel);
            } else {
                tagModel.btnClass = data.config.pendingClass;
                tagModel.btn = '&#10003';
            }
            
            $('<li></li>', {
                html: tagModel.buildHTML()
            }).insertBefore($this.find('input').parent('li'));
        }
        
        data.config.afterTagAdded.call(this);
    }
    
    /*!
     * Method to unset the seleted tag from tags array, then rerender the tags list
     *
     * @param string text
     * @return void
     */
    function deleteTag(text) {
        var $this = $(this),
            data = $this.data('taginput');        
        
        if (text) {
            // Unset the tag
            data.tags = $.grep(data.tags, function(tag) {
                return tag.text !== text;
            });
            
            renderTags.call(this);
        }
        
        data.config.afterTagDeleted.call(this);
    }
    
    /*!
     * Method to check if the tag exists in the current tags array
     *
     * @param array tags
     * @param string text
     * @return bool
     */
    function checkTagExist(tags, text) {
        var result = false;
        
        $.each(tags, function() {
            if (this.text === text) {
                result = true;
            }
        });
        
        return result;
    }
    
    /*!
     * Method to reset the UI
     *
     * @return void
     */
    function resetUI() {
        var $this = $(this),
            data = $this.data('taginput'),
            $input = $this.find('input'),
            $lastTag = $this.find('li').eq(-2),
            numRows = 1;
        
        // Check the last tag exists
        if ($lastTag.length) {
            var lastRowWidth = $lastTag.position().left - $this.position().left + $lastTag.outerWidth(true) + 1; // plus 1px border
            // Reposition the input field
            $input.css('width',  (data.config.contentWidth - lastRowWidth > data.config.minInputWidth) ? data.config.contentWidth - lastRowWidth : '100%');
        }
        
        // Get total number of the tag rowsx
        numRows += parseInt(($input.position().top - $this.position().top)/data.config.rowHeight, 10);        
        
        // Change the height
        $this.animate({ height: (numRows * data.config.rowHeight) }, 80);
    }
    
    /*!
     * Function to display the tag rows
     *
     * @param array tags
     * @return void
     */
    function renderTags() {
        var $this = $(this),
            data = $this.data('taginput'),
            els = [];        
        
        removeTags.call(this);
        
        if (data.tags.length) {
            $.each(data.tags, function() {
                els.push('<li>' + this.buildHTML() + '</li>');
            });            
            
            // Display the tag rows to the content
            $this.find('ul').prepend(buildTags(els));
        }
        
        resetUI.call(this);
    }
    
    /*!
     * Function to apply pending style
     *
     * @param array tags
     * @return void
     */
    //function applyPendingStyle(added_tags) {
    //    var $this = $(this);
    //    
    //    $.each(added_tags, function() {
    //        $this.find("a[data-text='" + this.text + "']").addClass('pending');
    //    });
    //}
    
    /*!
     * Method to remove all the tags.
     *
     * @param bool pending
     * @return void
     */
    function removeTags(pending) {
        var $this = $(this),
            data = $this.data('taginput');
        
        $this.find('li').filter(function() {
            if (pending) {
                return $(this).find('a.' + data.config.pendingClass).length;
            } else {
                return $(this).find('a:not(.' + data.config.pendingClass +')').length;
            }
        }).remove();
    }
    
    /*!
     * Method to focus to the input field
     *
     * @return void
     */
    //function focusInput() {
    //    var $this = $(this);
    //    
    //    $this.find('input').focus();
    //}
    
    /*!
     * Function to generate the tags HTML
     *
     * @param object|string els
     * @return string
     */
    function buildTags(els) {
        var html = '';
        
        if ($.type(els) === 'string') { html = els; }
        if ($.type(els) === 'array') { html = els.join(''); }
        
        return html || '';
    }
    
    /*!
     * Create the jQuery plugin
     */
    $.fn.tagInput = function(method) {
        if (Methods[method]) {
            return Methods[method].apply( this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return init.apply(this, arguments);
        } else {
            $.error( 'Method \'' +  method + '\' does not exist on jQuery.tagInput' );
        }
    };
})(window, jQuery);

