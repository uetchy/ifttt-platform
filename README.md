<h1 align="center">
  Ifso
</h1>

## Installation

```bash
npm install -g ifso
# or
yarn add --global ifso
```

## Usage

```bash
npx ifso server
```

### Writing `action` for IFTTT service

```js
exports.default = async ({ actionFields }) => {
  const { text } = actionFields
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
