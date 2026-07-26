# Function: readSkillFiles()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / readSkillFiles

# Function: readSkillFiles()

> **readSkillFiles**(`skillDir`, `resources`): `Promise`\<`Record`\<`string`, `string`\>\>

Defined in: [agentskills-io.ts:240](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/agentskills-io.ts#L240)

Read resource files from a skill directory.

## Parameters

### skillDir

`string`

Absolute path to the skill directory

### resources

`string`[]

Array of resource file paths (relative to skillDir)

## Returns

`Promise`\<`Record`\<`string`, `string`\>\>

Map of relative path to file content

## Example

```ts
readSkillFiles('/path/to/skill', ['checklist.md', 'config.json'])
// { 'checklist.md': '...', 'config.json': '...' }
```
