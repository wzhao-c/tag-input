# Tag Input

Tag Input is a simple jQuery plugin. It works in all modem browsers.

Tested width jQuery version 1.9.1

Min file size ~ 5.6Kb

![Image Alt](https://raw.github.com/wei-zhao-83/Tag-Input/master/TagInput.jpg)

### Update (May 22, 2013)
Added the documentation.

## How to Use

First, load jQuery (1.9.1 or greater), and the plugin. 
Put all the javascipt at the bottom to improve your site performance.
http://developer.yahoo.com/performance/rules.html
```html
<script type="text/javascript" src="js/lib/jquery-1.9.1.js"></script>
<script type="text/javascript" src="js/tag.min.js"></script>
```

Then linking the CSS file to your project:
```html
<link href="css/tag.css" media="all" rel="stylesheet" type="text/css">
```

You can simply init Tag Input with one line:

```javascript
(function($) {
    $('.element').tagInput();
})(jQuery)
```

## Configuration
```javascript
$('.element').tagInput({
    wrapperWidth:      300,
    contentWidth:      270,
    minInputWidth:     30,
    rowHeight:         30,
    
    placeHolder:       '',
    pendingClass:      'pending',
    
    callURL:           '',
    callMethod:        CallMethods.POST,
    localStore:        true,
    autoSearch:        false
});
```

## Methods

### importData()
Two ways to import a list of tags.

```javascript
$('.element').tagInput('importData', ['text1', 'text2', 'text3', 'text4', 'text5']);
```

```javascript
$('.element').tagInput('importData', [
    {text: 'text1', link: 'http://www.google.com', btn: '+'},
    {text: 'text2', link: 'http://www.yahoo.com', btn: '-'},
    {text: 'text3', link: 'http://www.facebook.com', btn: 'o'}
]);
```

### destory()
Remove config data and tags data when deallocating the plugin
```javascript
$('.element').tagInput('destory');
```

## Events

### afterTagAdded
```javascript
$('.element').tagInput({
    afterTagAdded: function() {
        // Put your code here
    }
});
```
### afterTagDeleted
```javascript
$('.element').tagInput({
    afterTagDeleted: function() {
        // Put your code here
    }
});
```

### afterSearchCompleted
```javascript
$('.element').tagInput({
    afterSearchCompleted: function() {
        // Put your code here
    }
});
```

## Author
[Wei Zhao](http://github.com/wei-zhao-83)

## License
Tag Input is released under the MIT license


