# Type Alias: IRVersion

> [**@a16njs/models**](../)

[**@a16njs/models**](../)

***

[@a16njs/models](../) / IRVersion

# Type Alias: IRVersion

> **IRVersion** = `string` & `object`

Defined in: [version.ts:15](https://github.com/Texarkanine/a16n/blob/92bc666abe646617e04ba6f4abc9e322a7ece80a/packages/models/src/version.ts#L15)

Kubernetes-style IR version format.
Format: v{major}{stability}{revision}
Examples: v1beta1, v2alpha3, v1stable1, v11 (stable)

Requirements:
- Must start with 'v'
- Must have a major version number
- May have stability identifier (alpha, beta, stable, or empty for stable)
- Must end with a revision number (trailing number required)

Valid: v1beta1, v2alpha3, v10stable5, v11
Invalid: v1, v2beta, vbeta1, 1beta1

## Type Declaration

### \_\_brand

> `readonly` **\_\_brand**: `"IRVersion"`
