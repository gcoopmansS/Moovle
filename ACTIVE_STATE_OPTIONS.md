# Active Button State Options

## Current State

```css
isactive? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
```

## Option 1: Minimal with underline

```css
isactive? "text-blue-600 border-b-2 border-blue-600" 
  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
```

## Option 2: Subtle border

```css
isactive? "text-blue-600 bg-blue-50 border border-blue-200" 
  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
```

## Option 3: Just color change

```css
isactive? "text-blue-600 font-semibold" 
  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
```

## Option 4: Darker background

```css
isactive? "text-white bg-blue-600" 
  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
```

## Option 5: Ring focus style

```css
isactive? "text-blue-600 bg-blue-50 ring-1 ring-blue-200" 
  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";
```

Let me know which direction you prefer and I'll update the component!
