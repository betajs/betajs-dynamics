

The ba-return partial executes the code passed into it, or calls a function from the related dynamic, when the user presses the return/enter key when he is in the input field this is placed on.

#### Example:

Will call an alert pop-up displaying the text in the input field.


```html
<input ba-return="alert({{input_value}})" value={{input_value}} />
```
