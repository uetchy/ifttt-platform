<div style="text-align: center">
  <h1>ifttt-platform</h1>
</div>

## Installation

```bash
npm install -g ifttt-platform
# or
yarn add --global ifttt-platform
```

## Usage

### Writing `action` for IFTTT service

```js
exports.default = async (query) => {
  const { text } = query.actionFields
}
```

## Writing `trigger`

```js
exports.default = async (query) => {

}
```
