# Function: readSkillFiles()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / readSkillFiles

# Function: readSkillFiles()

> **readSkillFiles**(`skillDir`, `resources`): `Promise`\<`Record`\<`string`, `string`\>\>

Defined in: [agentskills-io.ts:117](https://github.com/Texarkanine/a16n/blob/da80b7ce7e1c2f673a173df8051c4e7a36d9fe05/packages/models/src/agentskills-io.ts#L117)

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
