# Function: readSkillFiles()

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / readSkillFiles

# Function: readSkillFiles()

> **readSkillFiles**(`skillDir`, `resources`): `Promise`\<`Record`\<`string`, `string`\>\>

Defined in: [agentskills-io.ts:117](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/agentskills-io.ts#L117)

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
