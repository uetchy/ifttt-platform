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

```bash
npx ifttt-platform server
```

### Writing `action` for IFTTT service

```js
exports.default = async query => {
  const { text } = query.actionFields
  console.log(`received: ${text}`)
}
```

```js
exports.default = new Promise((resolve, reject) => {
  const { text } = query.actionFields
  console.log(`received: ${text}`)
})
```

## Writing `trigger`

```js
exports.default = async query => {}
```
