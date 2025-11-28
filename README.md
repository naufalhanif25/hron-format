# Hierarchical Reference Object Notation (HRON)

HRON (Hierarchical Reference Object Notation) is a structured text format designed to provide an efficient balance between human readability, compactness, and high-performance parsing. It is suitable for configuration files, data transport, and machine-generated data while still remaining easy to read and write manually.

---

## Table of Contents

1. [Why HRON?](#why-hron)
2. [Syntax Comparison Examples](#syntax-comparison-examples)
3. [Usage in JavaScript / TypeScript](#usage-in-javascript--typescript)
4. [Benchmark Results](#benchmark-results)
5. [License](#license)

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
        {1,'Alice','admin',true,['sport','run','game']},
        {2,'Bob','user',false,['swim','travel','code']}
    ]
}
```

---

## Usage in JavaScript / TypeScript

This section provides a basic example of how HRON is used in a JavaScript or TypeScript environment.

### Parsing HRON

The following example shows how to read and parse an HRON file into a JavaScript object.

```ts
import { HRON } from "./src/hron";

const hron = new HRON();
const file = Bun.file("public/example.hron");

console.log(hron.parse(await file.text()));
```

### Converting JavaScript Object to HRON

The following example shows how JavaScript object can be converted into an HRON representation.

```ts
import { HRON } from "./src/hron";
import data from "./public/example.json";

const hron = new HRON();

console.log(hron.translator.toHRON(data));
```

---

## Benchmark Results

This section displays the performance test results of HRON compared to other formats in terms of decoding, encoding, and file size.

### Decode Speed (10 iterations)

```bash
HRON:  0.202 ms
TOON:  0.418 ms
JSON:  0.005 ms
YAML:  0.019 ms
XML:   0.340 ms
```

### Encode Speed (10 iterations)

```bash
HRON:  0.035 ms
TOON:  0.315 ms
JSON:  0.002 ms
YAML:  0.010 ms
XML:   0.063 ms
```

### File Size

```bash
HRON: 176 B
TOON: 222 B
JSON: 620 B
YAML: 273 B
XML:  511 B
```

**Summary:** HRON is faster at encoding and decoding than some other formats, and produces smaller output compared to other formats.

---

## License

This project is distributed under the MIT License.
See the `LICENSE` file for full details.
