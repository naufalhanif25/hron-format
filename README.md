# Hierarchical Reference Object Notation (HRON)

HRON (Hierarchical Reference Object Notation) is a structured text format designed to provide an efficient balance between human readability, compactness, and high-performance parsing. It is suitable for configuration files, data transport, and machine-generated data while still remaining easy to read and write manually.

---

## Table of Contents

* [Why HRON?](#why-hron)
* [Syntax Comparison Examples](#syntax-comparison-examples)
* [Installation & Quick Start](#installation--quick-start)
* [Benchmark Results](#benchmark-results)
* [License](#license)

---

## Why HRON?

HRON was developed to address limitations found in formats such as JSON, XML, YAML, and TOON. The key advantages of HRON include:

### 1. Minimal Syntax

HRON removes unnecessary punctuation and avoids overly complex structural rules with the concept of pre-defined keys. The format is clean, predictable, and far less error-prone.

### 2. High Performance

HRON is optimized for rapid serialization and deserialization.
Based on benchmark tests, HRON outperforms formats like TOON in both encoding and decoding speed.

### 3. Compact File Size

Its concise notation produces smaller output files, making it suitable for network transmission, caching, and storage of large datasets.

### 4. Deterministic Structure

Unlike YAML, which allows ambiguous and context-dependent interpretation, HRON enforces deterministic syntax, making it safe for both machines and humans.

### 5. Simplicity Without XML-like Noise

HRON avoids verbose, tag-based syntax while maintaining clarity and structure.

---

## Syntax Comparison Examples

Assume the following data:

```json
{
    "data": {
        "users": [
            { "id": 1, "name": "Alice", "role": "admin", "verified": false, "hobbies": [ "sport", "run", "game" ] },
            { "id": 2, "name": "Bob", "role": "user", "verified": false, "hobbies": [ "swim", "travel", "code" ] }
        ]
    }
}
```

The following comparison shows how the same data structure is represented by different formats.

### JSON

JSON displays data structures in the form of explicit objects and arrays and is very commonly used.

```json
{
    "data": {
        "users": [
            { "id": 1, "name": "Alice", "role": "admin", "verified": false, "hobbies": [ "sport", "run", "game" ] },
            { "id": 2, "name": "Bob", "role": "user", "verified": false, "hobbies": [ "swim", "travel", "code" ] }
        ]
    }
}
```

### YAML

YAML presents data structures with a more concise syntax but relies on indentation to define hierarchy.

```yaml
data:
  users:
    - id: 1
      name: Alice
      role: admin
      verified: false
      hobbies:
        - sport
        - run
        - game
    - id: 2
      name: Bob
      role: user
      verified: false
      hobbies:
        - swim
        - travel
        - code
```

### XML

XML uses pairs of opening and closing tags to form a very explicit and verbos data structure.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<data>
    <users>
        <id>1</id>
        <name>Alice</name>
        <role>admin</role>
        <verified>false</verified>
        <hobbies>sport</hobbies>
        <hobbies>run</hobbies>
        <hobbies>game</hobbies>
    </users>
    <users>
        <id>2</id>
        <name>Bob</name>
        <role>user</role>
        <verified>false</verified>
        <hobbies>swim</hobbies>
        <hobbies>travel</hobbies>
        <hobbies>code</hobbies>
    </users>
</data>
```

### TOON

TOON combines YAML and JSON styles with a denser structure and type-based annotation support.

```
data:
  users[2]:
    - id: 1
      name: Alice
      role: admin
      verified: false
      hobbies[3]: sport,run,game
    - id: 2
      name: Bob
      role: user
      verified: false
      hobbies[3]: swim,travel,code
```

### HRON

HRON expresses data structures through separate key and value declarations, ensuring data remains compact yet structured.

```
data{users[{id,name,role,verified,hobbies[]}]}: {
    [
        {1,'Alice','admin',false,['sport','run','game']},
        {2,'Bob','user',false,['swim','travel','code']}
    ]
}
```

---

## Installation & Quick Start

### CLI Tool

This section provides a basic examples of how the HRON CLI tool is used. You can try the HRON CLI tool instantly with npx.

#### Usage

```shell
# Encode JavaScript objects into HRON string
npx hron --encode data.json data.hron
# or by using pipe from stdin
cat data.json | npx hron --encode

# Decode HRON string into JavaScript objects
npx hron --decode data.hron data.json
# or by using pipe from stdin
cat data.hron | npx hron --decode
```

### JavaScript / TypeScript

This section provides an installation guide and basic examples of how HRON is used in a JavaScript or TypeScript environment.

#### Installation
```shell
# Installation using NPM
npm install hron-format

# Installation using yarn
yarn add hron-format

# Installation using bun
bun add hron-format
```

#### Parsing HRON

The following example shows how to read and parse an HRON file into a JavaScript object.

```ts
import { hron } from "hron-format";

const data = `
data{users[{id,name,role,verified,hobbies[]}]}: {
  [
    {1,'Alice','admin',false,['sport','run','game']},
    {2,'Bob','user',false,['swim','travel','code']}
  ]
}
`

console.log(hron.parse(data).object);
// {
//   data: {
//     users: [
//       [Object ...], [Object ...]
//     ],
//   },
// }

```

#### Converting JavaScript Object to HRON

The following example shows how JavaScript object can be converted into an HRON representation.

```ts
import { hron } from "hron-format";

const data = {
  data: {
    users: [
      { id: 1, name: "Alice", role: "admin", verified: false, hobbies: [ "sport", "run", "game" ] },
      { id: 2, name: "Bob", role: "user", verified: false, hobbies: [ "swim", "travel", "code" ] }
    ]
  }
}

console.log(hron.stringify(data));
// data{users[{id,name,role,verified,hobbies[]}]}: {
//   [
//     {
//       1,'Alice','admin',false,[
//         'sport','run','game'
//       ]
//     },{
//       2,'Bob','user',false,[
//         'swim','travel','code'
//       ]
//     }
//   ]
// }
```

> [!NOTE]
> Input must contain a single root object that holds all nested data.

---

## Benchmark Results

This section displays the performance test results of HRON compared to other formats in terms of decoding, encoding, and file size.

### Decode Speed (10 iterations)

```bash
HRON :  0.218 ms
TOON :  0.424 ms
JSON :  0.006 ms
YAML :  0.023 ms
XML  :  0.339 ms
```

### Encode Speed (10 iterations)

```bash
HRON :  0.118 ms
TOON :  0.380 ms
JSON :  0.002 ms
YAML :  0.016 ms
XML  :  0.077 ms
```

### File Size

```bash
HRON :  176 B
TOON :  222 B
JSON :  620 B
YAML :  273 B
XML  :  511 B
```

> [!NOTE]
> JSON and YAML are faster because they rely on highly optimized, native parsing and serialization routines built directly into widely used runtime libraries.

**Summary:** HRON is faster at encoding and decoding than some other formats, and produces smaller output compared to other formats.

---

## License

This project is distributed under the MIT License.
See the `LICENSE` file for full details.
