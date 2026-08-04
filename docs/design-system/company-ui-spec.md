# UI Specification for Enterprise HIS Console

## 1. Scope

This document defines the user interface specifications for the medical information system. All generated pages, components and style sheets must comply with the provisions of this document. If certain requirements are missing in the product description or in Figma, please use the default settings in this document instead of designing new styles on your own.

## 2. Non-Negotiable Global Rules

1. Use a light theme. The default page background MUST be a light blue-gray. The default card and panel background MUST be white.
2. Use blue as the primary brand color. The canonical primary color is `#2469F2`.
3. Use an 8pt spacing system with 4px as the minimum adjustment unit.
4. All standard action buttons and standard single-line inputs MUST use `32px` height by default.
5. All standard form controls MUST use `4px` corner radius unless this document explicitly defines a different radius.
6. Do not use large pill-shaped controls for normal enterprise forms. Reserve pill/circle shapes for explicitly defined special button variants only.
7. Do not use browser-native checkbox appearance. Render checkboxes with a custom visual layer.
8. Form and table containers MUST stretch horizontally with the page. Fixed icons, text size, and fixed-height illustrations MUST NOT scale with viewport width.
9. Use deterministic states. Every interactive control MUST define default, hover, active, disabled, and focus behavior.
10. If no component size is specified, use `md`.

## 3. Design Tokens

### 3.1 Color Tokens

#### Brand and Primary

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-color-brand` | `#2469F2` | Brand anchor color |
| `--ui-color-primary` | `#2469F2` | Primary action, selected state |
| `--ui-color-primary-hover` | `#4D94FF` | Primary hover |
| `--ui-color-primary-active` | `#215ED9` | Primary pressed |
| `--ui-color-primary-soft` | `#E0EFFF` | Light selected background |
| `--ui-color-primary-soft-hover` | `#F2F8FF` | Light hover background |
| `--ui-color-primary-deep` | `#0A1C40` | Dark sidebar level 1 |
| `--ui-color-primary-deeper` | `#0F2C66` | Dark sidebar level 2 |

#### Neutral

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-color-white` | `#FFFFFF` | Card, table, input background |
| `--ui-color-gray-1` | `#FFFFFF` | Base white |
| `--ui-color-gray-2` | `#F9F9F9` | Zebra row background |
| `--ui-color-gray-3` | `#F5F5F5` | Disabled input background |
| `--ui-color-gray-4` | `#EEEEEE` | Table header background, disabled button background |
| `--ui-color-gray-5` | `#DBDBDB` | Default border, checkbox border |
| `--ui-color-gray-6` | `#CCCCCC` | Secondary disabled stroke/icon |
| `--ui-color-gray-7` | `#999999` | Weak text, disabled text |
| `--ui-color-gray-8` | `#808080` | Low-emphasis text |
| `--ui-color-gray-9` | `#666666` | Secondary text |
| `--ui-color-gray-10` | `#404040` | Strong text |
| `--ui-color-gray-11` | `#262626` | Primary text |
| `--ui-color-gray-12` | `#000000` | Overlay or deepest neutral |

#### Background Blue-Gray

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-color-bg-page` | `#EBEEF2` | Application page background |
| `--ui-color-bg-page-deep` | `#E2E6EB` | Global background depth |
| `--ui-color-bg-section` | `#F2F5F7` | Section / work area background |
| `--ui-color-bluegray-4` | `#CED3DB` | Structural divider area |
| `--ui-color-bluegray-5` | `#B8BFCC` | Muted icon/status |
| `--ui-color-bluegray-6` | `#8A8F99` | Secondary icon |
| `--ui-color-bluegray-7` | `#5A5D66` | Dark muted text |

#### Semantic Feedback

Use semantic aliases. When the source Bee Tag token library is available, bind directly to `--bf-success-*`, `--bf-warning-*`, and `--bf-error-*`.

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-color-success` | `var(--bf-success-7, #22A046)` | Success button and positive status |
| `--ui-color-success-soft` | `var(--bf-success-2, #D4FAD9)` | Success soft background |
| `--ui-color-warning` | `var(--bf-warning-7, #E5710B)` | Warning button and warning status |
| `--ui-color-warning-soft` | `var(--bf-warning-2, #FFECD9)` | Warning soft background |
| `--ui-color-danger` | `var(--bf-error-7, #E03134)` | Danger button and error status |
| `--ui-color-danger-soft` | `var(--bf-error-1, #FFF3F2)` | Error soft background |

### 3.2 Typography Tokens

Use the following font stack:

```css
 "Helvetica Neue",Helvetica,Arial,"Microsoft YaHei","微软雅黑","PingFang SC","Hiragino Sans GB",sans-serif;
```

| Token | Font Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- |
| `--ui-font-t1` | `12px` | `18px` | `400` | Hint, helper, timestamp |
| `--ui-font-t2` | `14px` | `22px` | `400` | Body text, table text, menu text, default button text |
| `--ui-font-t3` | `16px` | `24px` | `400` | Module title, top nav text |
| `--ui-font-t4` | `18px` | `26px` | `700` | Page title |
| `--ui-font-t5` | `20px` | `28px` | `700` | Important page title |
| `--ui-font-t6` | `24px` | `32px` | `700` | System title / hero title |

Derived text roles:

| Token | Value |
| --- | --- |
| `--ui-text-primary` | `var(--ui-color-gray-11)` |
| `--ui-text-secondary` | `var(--ui-color-gray-9)` |
| `--ui-text-tertiary` | `var(--ui-color-gray-7)` |
| `--ui-text-placeholder` | `var(--ui-color-gray-7)` |
| `--ui-text-disabled` | `var(--ui-color-gray-7)` |
| `--ui-text-on-primary` | `#FFFFFF` |

### 3.3 Spacing Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-space-0` | `0px` | Reset |
| `--ui-space-1` | `4px` | Icon gap, fine adjustment |
| `--ui-space-2` | `8px` | Compact component gap |
| `--ui-space-3` | `12px` | Input horizontal padding, table cell horizontal padding |
| `--ui-space-4` | `16px` | Default form item gap, section gap |
| `--ui-space-5` | `24px` | Page block spacing |
| `--ui-space-6` | `32px` | Major layout spacing |

### 3.4 Radius Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-radius-none` | `0px` | Square variants only |
| `--ui-radius-xs` | `2px` | Checkbox, tiny controls |
| `--ui-radius-sm` | `4px` | Buttons, inputs, selects, tabs, menu item background |
| `--ui-radius-md` | `8px` | Modal and popover container |
| `--ui-radius-lg` | `16px` | Large card only |

### 3.5 Border and Shadow Tokens

| Token | Value |
| --- | --- |
| `--ui-border-color` | `#DBDBDB` |
| `--ui-border-color-light` | `#EEEEEE` |
| `--ui-border-default` | `1px solid var(--ui-border-color)` |
| `--ui-border-light` | `1px solid var(--ui-border-color-light)` |
| `--ui-shadow-none` | `none` |
| `--ui-shadow-1` | `0 0 8px rgba(0, 0, 0, 0.10)` |
| `--ui-shadow-2` | `0 0 16px rgba(0, 0, 0, 0.10)` |
| `--ui-focus-ring` | `0 0 0 2px rgba(36, 105, 242, 0.16)` |

### 3.6 Size Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--ui-size-xs` | `24px` | XS control |
| `--ui-size-sm` | `28px` | SM control |
| `--ui-size-md` | `32px` | Default control |
| `--ui-size-lg` | `40px` | LG control |
| `--ui-size-xl` | `48px` | Large special control |

## 4. Global Layout Rules

1. Use responsive breakpoints aligned to `xs < 768`, `sm >= 768`, `md >= 992`, `lg >= 1200`, `xl >= 1920`.
2. Keep fixed-height controls unchanged across responsive width changes.
3. Allow forms and tables to stretch horizontally. When content can no longer fit, keep the content width and show horizontal scrolling instead of shrinking text or controls.
4. Use a `24`-column grid for complex desktop layouts.
5. The default enterprise workspace layout is `Header + Sider + Content`.
6. The expanded side navigation width MUST be `200px`.
7. The collapsed side navigation width MUST be `60px`.

## 5. Interaction Rules

1. Every clickable component MUST define `default`, `hover`, `active`, `disabled`, and `focus-visible` state.
2. Use a custom focus ring. Do not rely on browser-native focus styling.
3. Disabled controls MUST suppress hover and active feedback.
4. Text buttons and inline operations MUST use color change instead of heavy background fills.
5. Error messages MUST use the danger semantic palette. Helper text MUST use `12px` or `14px` text, never `16px+`.

## 6. Component Specifications

### 6.1 Button

#### API

| Prop | Type | Default | Rule |
| --- | --- | --- | --- |
| `variant` | `'filled' \| 'outline' \| 'text' \| 'icon'` | `'filled'` | Use `filled` for primary actions, `outline` for secondary actions |
| `tone` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'primary'` | `neutral` is only for text/icon actions |
| `size` | `'lg' \| 'md' \| 'sm' \| 'xs'` | `'md'` | Default button height MUST be `32px` |
| `icon` | `ReactNode` | `undefined` | Icon and text gap MUST be `4px` |
| `loading` | `boolean` | `false` | Replace clickability with loading state |
| `disabled` | `boolean` | `false` | Disabled state MUST mute colors |
| `block` | `boolean` | `false` | Use only in forms or modal footers |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Explicitly set in forms |

#### Style Rules

| Size | Height | Font | Horizontal Padding |
| --- | --- | --- | --- |
| `lg` | `40px` | `14px / 22px` | `20px` |
| `md` | `32px` | `14px / 22px` | `16px` |
| `sm` | `28px` | `14px / 22px` | `14px` |
| `xs` | `24px` | `12px / 18px` | `12px` |

Mandatory rules:

1. Standard buttons MUST use `border-radius: 4px`.
2. Button text MUST use an action verb and MUST stay within 6 Chinese characters.
3. Text on both sides of the label MUST follow the source rule: horizontal padding equals half of control height.
4. `filled.primary` MUST use:
   - default: background `#2469F2`, text `#FFFFFF`
   - hover: background `#4D94FF`
   - active: background `#215ED9`
   - disabled: background `#EEEEEE`, text `#999999`
   - loading: background `#73B0FF`, text `rgba(255,255,255,0.5)`
5. `outline.primary` MUST use white background, `1px solid #2469F2`, text `#2469F2`.
6. `outline.primary:hover` MUST use background `#E0EFFF`.
7. `outline.primary:active` MUST use background `#BDDCFF` and border/text `#215ED9`.
8. `text` buttons MUST not render a border.
9. Icon-only buttons MUST be square. Width MUST equal height.

### 6.2 Input

#### API

| Prop | Type | Default | Rule |
| --- | --- | --- | --- |
| `size` | `'lg' \| 'md' \| 'sm' \| 'xs'` | `'md'` | Default input height MUST be `32px` |
| `status` | `'default' \| 'success' \| 'error' \| 'disabled'` | `'default'` | `error` overrides focus color |
| `prefix` | `ReactNode` | `undefined` | Use for semantic hint only |
| `suffix` | `ReactNode` | `undefined` | Use for clear, password toggle, search, validation icon |
| `allowClear` | `boolean` | `false` | Show clear icon on hover or when there is content |
| `placeholder` | `string` | `''` | Use placeholder text color token |
| `maxLength` | `number` | `undefined` | Show counter for textarea or explicit length-limited input |
| `multiline` | `boolean` | `false` | Use textarea mode |
| `autoGrow` | `boolean` | `false` | Enable only when `multiline=true` |

#### Style Rules

| Size | Height | Horizontal Padding | Vertical Padding | Font |
| --- | --- | --- | --- | --- |
| `lg` | `40px` | `16px` | `16px` | `14px / 22px` |
| `md` | `32px` | `12px` | `8px` | `14px / 22px` |
| `sm` | `28px` | `12px` | `8px` | `14px / 22px` |
| `xs` | `24px` | `12px` | `8px` | `12px / 18px` |

Mandatory rules:

1. Standard single-line input MUST use `height: 32px` unless a different size is explicitly requested.
2. All inputs MUST use `border-radius: 4px`.
3. Default border MUST be `1px solid #DBDBDB`.
4. Hover border MUST switch to primary blue.
5. Focus-visible state MUST use primary border plus custom focus ring.
6. Disabled input MUST use background `#F5F5F5`, border `#DBDBDB`, text `#999999`.
7. Placeholder text MUST use `#999999`.
8. Prefix/suffix icons MUST align vertically to center.
9. Required marks MUST use the danger color.
10. Multi-line input MUST show 2 rows by default.
11. Auto-growing multi-line input MUST stop at 4 rows and MUST cap height at `100px`.
12. When text exceeds `maxLength`, the counter MUST turn danger color and the field MUST refuse further input.

### 6.3 Checkbox

#### API

| Prop | Type | Default | Rule |
| --- | --- | --- | --- |
| `checked` | `boolean` | `false` | Controlled selection state |
| `indeterminate` | `boolean` | `false` | Mixed state |
| `disabled` | `boolean` | `false` | No hover and no active state |
| `emphasis` | `boolean` | `false` | Strong attention style if business flow requires it |
| `label` | `string \| ReactNode` | `undefined` | Text sits to the right |
| `name` | `string` | `undefined` | Form binding |
| `value` | `string \| number` | `undefined` | Form binding |
| `onChange` | `(checked: boolean) => void` | `undefined` | Required for interaction |

#### Style Rules

1. Render a custom checkbox control. Do not use browser-native `appearance`.
2. The visual box MUST be `16px × 16px`.
3. The box MUST use `border-radius: 2px`.
4. Unchecked default state MUST use white background and `1px solid #DBDBDB`.
5. Checked state MUST use background `#2469F2`, border `#2469F2`, and a white check mark.
6. Indeterminate state MUST use background `#2469F2`, border `#2469F2`, and a white horizontal bar.
7. Hover state MUST change the border to `#2469F2`.
8. Disabled unchecked state MUST use background `#F5F5F5`, border `#DBDBDB`, and muted label text.
9. Disabled checked state MUST use muted filled styling and MUST remain visually selected.
10. Remove the browser default focus style completely. Apply a custom `box-shadow: var(--ui-focus-ring)` on the custom visual box when keyboard focus is visible.
11. Checkbox label gap MUST be `8px`.
12. Checkbox group gap MUST be `16px`.
13. Horizontal and vertical group layouts are both valid. The default group spacing MUST follow the source guideline: item padding `8px`, group margin `16px`.

Reference structure:

```tsx
type CheckboxProps = {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  emphasis?: boolean;
  label?: React.ReactNode;
  name?: string;
  value?: string | number;
  onChange?: (checked: boolean) => void;
};
```

### 6.4 Radio

#### API

| Prop | Type | Default |
| --- | --- | --- |
| `checked` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `emphasis` | `boolean` | `false` |
| `label` | `string \| ReactNode` | `undefined` |
| `name` | `string` | `undefined` |
| `value` | `string \| number` | `undefined` |

Style rules:

1. Radio group item spacing MUST match checkbox group spacing.
2. The selected dot MUST use primary blue.
3. Disabled label text MUST use `#999999`.

### 6.5 Select

#### API

| Prop | Type | Default | Rule |
| --- | --- | --- | --- |
| `size` | `'lg' \| 'md' \| 'sm' \| 'xs'` | `'md'` | Default control height is `32px` |
| `mode` | `'single' \| 'multiple' \| 'tags'` | `'single'` | Use `multiple` for filter selection |
| `searchable` | `boolean` | `false` | Enable when option count is large |
| `clearable` | `boolean` | `false` | Show clear icon when selected |
| `disabled` | `boolean` | `false` | Use disabled visual tokens |
| `status` | `'default' \| 'error'` | `'default'` | Error overrides hover/focus |

Style rules:

1. Control height MUST follow the input size scale.
2. `md`, `sm`, and `xs` dropdown option height MUST be input height plus `4px`.
3. Select and input MUST share border, radius, placeholder, disabled, and focus styles.
4. Multi-select tags inside the control MUST wrap and truncate before breaking layout.

### 6.6 Form

#### API

| Prop | Type | Default | Rule |
| --- | --- | --- | --- |
| `layout` | `'horizontal' \| 'vertical' \| 'inline'` | `'horizontal'` | Use horizontal for edit forms, inline for search bars |
| `size` | `'lg' \| 'md' \| 'sm' \| 'xs'` | `'md'` | Child controls inherit size |
| `labelAlign` | `'left' \| 'right' \| 'top' \| 'between'` | `'right'` | Use consistent alignment per form |
| `requiredMark` | `boolean` | `true` | Required fields show `*` |

Form rules:

1. Child controls MUST inherit the form size.
2. Default form item vertical gap MUST be `16px`.
3. Label text MUST stay within `* + 6 Chinese characters`. Overflow MUST wrap.
4. Helper text and validation text MUST render below the field, not inside the label area.
5. Search forms MUST use inline layout and default `md` size.

### 6.7 Table

#### API

| Prop | Type | Default | Rule |
| --- | --- | --- | --- |
| `size` | `'md' \| 'sm'` | `'md'` | Use `md` for standard desktop list pages |
| `striped` | `boolean` | `false` | Zebra rows use gray-2 |
| `hoverable` | `boolean` | `true` | Hover row color uses primary soft background |
| `rowSelection` | `'none' \| 'single' \| 'multiple'` | `'none'` | `single` highlights the row; `multiple` relies on checkbox state by default |
| `summary` | `boolean` | `false` | Summary row background uses gray-4 |
| `fixedHeader` | `boolean` | `false` | Enable for long lists |
| `fixedColumns` | `boolean` | `false` | Use when operations must stay visible |
| `inlineEdit` | `boolean` | `false` | Supported |

#### Style Rules

| Part | `md` | `sm` |
| --- | --- | --- |
| Header height | `40px` | `32px` |
| Body row height | `40px` | `32px` |
| Cell horizontal padding | `12px` | `12px` |
| Border | `1px solid #DBDBDB` | `1px solid #DBDBDB` |

Mandatory rules:

1. Table header background MUST be `#EEEEEE`.
2. Summary row background MUST be `#EEEEEE`.
3. Default row background MUST be white.
4. Zebra row background MUST be `#F9F9F9`.
5. Hover row background MUST be `#F2F8FF`.
6. Focused or selected single row background MUST be `#E0EFFF`.
7. Error-highlighted row background MUST use danger soft background.
8. Table cells MUST support text, icon, button, tag, radio, and checkbox content.
9. Empty state MUST remain inside the table container.
10. Inline edit row MUST switch buttons to `保存 / 取消`.

### 6.8 Tag

#### API

| Prop | Type | Default |
| --- | --- | --- |
| `tone` | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` |
| `variant` | `'plain' \| 'solid'` | `'plain'` |
| `size` | `'lg' \| 'md' \| 'sm' \| 'xs'` | `'md'` |
| `closable` | `boolean` | `false` |

Style rules:

1. Default tag heights MUST support `32 / 28 / 24 / 20`.
2. Tag radius MUST be `4px`.
3. Tag padding MUST use `8px` horizontally and `4px` internally for close icon handling.

### 6.9 Pagination

#### API

| Prop | Type | Default |
| --- | --- | --- |
| `current` | `number` | `1` |
| `pageSize` | `number` | `10` |
| `total` | `number` | `0` |
| `showSizeChanger` | `boolean` | `false` |
| `showQuickJumper` | `boolean` | `false` |
| `showTotal` | `boolean` | `false` |

Style rules:

1. Pagination item size MUST be `32px × 32px`.
2. Pagination item radius MUST be `4px`.
3. Focused page item MUST use dark fill with white text or primary-colored text depending on variant.

### 6.10 Navigation Menu

#### API

| Prop | Type | Default |
| --- | --- | --- |
| `mode` | `'side' \| 'top'` | `'side'` |
| `collapsed` | `boolean` | `false` |
| `theme` | `'light' \| 'dark'` | `'light'` |
| `items` | `MenuItem[]` | `[]` |

Style rules:

1. Side navigation expanded width MUST be `200px`.
2. Side navigation collapsed width MUST be `60px`.
3. Menu item padding MUST use `16px`, `12px`, and `8px` levels from outside to inside.
4. Selected state MUST use primary blue.
5. Hover background MUST use a translucent dark or white overlay depending on light/dark menu theme.
6. Navigation depth MUST stay within `1` to `3` levels by default.
7. Fourth-level menu labels MUST truncate after 12 Chinese characters and show tooltip on hover.
8. When collapsed, hovering an icon MUST show the full menu name in a tooltip.

## 7. CSS Variable Implementation

Use an alias layer. Map product-level names to Bee Tag source tokens. Do not use raw palette hex values directly inside component files.

```css
:root {
  --ui-color-brand: var(--bf-brand, #2469F2);
  --ui-color-primary: var(--bf-theme-7, #2469F2);
  --ui-color-primary-hover: var(--bf-theme-6, #4D94FF);
  --ui-color-primary-active: var(--bf-theme-8, #215ED9);
  --ui-color-primary-soft: var(--bf-theme-2, #E0EFFF);
  --ui-color-primary-soft-hover: var(--bf-theme-1, #F2F8FF);

  --ui-color-bg-page: var(--bf-background-color-2, #EBEEF2);
  --ui-color-bg-section: var(--bf-background-color-3, #F2F5F7);
  --ui-color-bg-disabled-input: var(--bf-background-color-4, #F5F5F5);
  --ui-color-bg-disabled-button: var(--bf-background-color-5, #EEEEEE);

  --ui-color-text-primary: var(--bf-gray-11, #262626);
  --ui-color-text-secondary: var(--bf-gray-9, #666666);
  --ui-color-text-tertiary: var(--bf-gray-7, #999999);
  --ui-color-border: var(--bf-gray-5, #DBDBDB);
  --ui-color-border-light: var(--bf-gray-4, #EEEEEE);

  --ui-font-size-xs: 12px;
  --ui-font-size-sm: 14px;
  --ui-font-size-md: 16px;
  --ui-line-height-xs: 18px;
  --ui-line-height-sm: 22px;
  --ui-line-height-md: 24px;

  --ui-space-1: 4px;
  --ui-space-2: 8px;
  --ui-space-3: 12px;
  --ui-space-4: 16px;
  --ui-space-5: 24px;
  --ui-space-6: 32px;

  --ui-radius-xs: 2px;
  --ui-radius-sm: 4px;
  --ui-radius-md: 8px;

  --ui-control-height-xs: 24px;
  --ui-control-height-sm: 28px;
  --ui-control-height-md: 32px;
  --ui-control-height-lg: 40px;

  --ui-focus-ring: 0 0 0 2px rgba(36, 105, 242, 0.16);
}
```

Base styles:

```css
body {
  background: var(--ui-color-bg-page);
  color: var(--ui-color-text-primary);
  font: 400 14px/22px "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

.ui-control {
  height: var(--ui-control-height-md);
  border: 1px solid var(--ui-color-border);
  border-radius: var(--ui-radius-sm);
  background: #fff;
}

.ui-control:focus-visible {
  outline: none;
  border-color: var(--ui-color-primary);
  box-shadow: var(--ui-focus-ring);
}
```

## 8. Tailwind Implementation

Use semantic tokens inside `theme.extend`. Do not scatter hex values in JSX.

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        brand: "#2469F2",
        primary: {
          DEFAULT: "#2469F2",
          hover: "#4D94FF",
          active: "#215ED9",
          soft: "#E0EFFF",
          softHover: "#F2F8FF",
          deep: "#0A1C40",
          deeper: "#0F2C66",
        },
        gray: {
          1: "#FFFFFF",
          2: "#F9F9F9",
          3: "#F5F5F5",
          4: "#EEEEEE",
          5: "#DBDBDB",
          6: "#CCCCCC",
          7: "#999999",
          8: "#808080",
          9: "#666666",
          10: "#404040",
          11: "#262626",
          12: "#000000",
        },
        bluegray: {
          1: "#F2F5F7",
          2: "#EBEEF2",
          3: "#E2E6EB",
          4: "#CED3DB",
          5: "#B8BFCC",
          6: "#8A8F99",
          7: "#5A5D66",
        },
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "8px",
      },
      height: {
        xs: "24px",
        sm: "28px",
        md: "32px",
        lg: "40px",
      },
      minHeight: {
        xs: "24px",
        sm: "28px",
        md: "32px",
        lg: "40px",
      },
      boxShadow: {
        focus: "0 0 0 2px rgba(36, 105, 242, 0.16)",
        panel: "0 0 8px rgba(0, 0, 0, 0.10)",
      },
      fontSize: {
        t1: ["12px", "18px"],
        t2: ["14px", "22px"],
        t3: ["16px", "24px"],
        t4: ["18px", "26px"],
        t5: ["20px", "28px"],
        t6: ["24px", "32px"],
      },
    },
  },
} satisfies Config;
```

Utility aliases:

1. Use `h-md`, `rounded-sm`, `text-t2`, `px-3`, `bg-white`, `border-gray-5` as the default control stack.
2. Create component classes with `@layer components` for `btn-primary`, `btn-secondary`, `input-base`, `checkbox-base`, and `table-base`.
3. Never hardcode `rounded-lg` on form controls.
4. Never use Tailwind default blue scale directly. Always use the semantic `primary.*` palette from this spec.

## 9. Generation Rules for AI Coding Assistants

When Codex, Trae, or any other AI assistant generates UI code for this project, it MUST follow these defaults:

1. Use `md` size for buttons, inputs, selects, pagination, and most table toolbars.
2. Use `4px` radius for all standard controls.
3. Use `#2469F2` for primary buttons and selected states.
4. Use `#EBEEF2` as the page background and `#FFFFFF` as the panel background.
5. Use `14px / 22px` as the default body and control text.
6. Use `#DBDBDB` as the default border color.
7. Use custom checkbox rendering. Never ship native browser checkbox styling.
8. Use `#EEEEEE` for table headers and disabled button backgrounds.
9. Use `#F9F9F9` for zebra rows and `#F2F8FF` for hover highlight.
10. Do not invent new radii, heights, or palette values unless product design explicitly overrides this document.
