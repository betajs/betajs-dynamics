

The ba-return Partial executes the code passed into it, or calls a function from the related Dynamic,
when the user presses the return/enter key when he is in the input field this is placed on.

#### Example:

Will call an alert pop-up displaying the text in the input field.


```html
</input ba-return="alert({{input_value}})" value={{input_value}}>
```
