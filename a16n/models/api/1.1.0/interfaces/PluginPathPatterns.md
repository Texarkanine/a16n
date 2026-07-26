# Interface: PluginPathPatterns

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / PluginPathPatterns

# Interface: PluginPathPatterns

Defined in: [plugin.ts:73](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/plugin.ts#L73)

Path patterns for a plugin, used by transformations like path rewriting
to identify and handle file references specific to this plugin's format.

## Properties

### prefixes

> **prefixes**: `string`[]

Defined in: [plugin.ts:75](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/plugin.ts#L75)

Directory prefixes used by this plugin (e.g., ['.cursor/rules/', '.cursor/skills/'])

***

### extensions

> **extensions**: `string`[]

Defined in: [plugin.ts:77](https://github.com/Texarkanine/a16n/blob/deb79c8192ceab92f86b2d43632d7b4c46f60bcc/packages/models/src/plugin.ts#L77)

File extensions used by this plugin (e.g., ['.mdc', '.md'])
