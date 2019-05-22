export interface Ast {
  declarations: AstDeclaration[]
}

export type AstDeclaration = AstImport
  | AstNamedInterface
  | AstNamedType
  | AstStandaloneComment

export interface AstImport extends AstCommentable {
  whichDeclaration: "import"
  from: string
  defaultName?: string
  namedMembers?: {
    [exportedName: string]: string
  }
  asNamespace?: string
}

export interface AstInterface {
  whichType: "interface"
  entries: AstInterfaceEntry[]
}

export interface AstNamedInterface extends AstInterface, AstCommentable {
  whichDeclaration: "interface"
  name: string
  exported?: boolean
  extends?: string[]
}

export type AstInterfaceEntry = AstProperty
  | AstFunctionProperty
  | AstIndexSignature
  | AstMappedIndexSignature
  | AstStandaloneInterfaceComment

export interface AstProperty extends AstCommentable {
  whichEntry: "property"
  name: string
  type: AstType
  optional?: boolean
  readonly?: boolean
}

export interface AstFunctionProperty extends AstCommentable {
  whichEntry: "functionProperty"
  name: string
  type: AstFunctionType
  optional?: boolean
  readonly?: boolean
}

export interface AstIndexSignature extends AstCommentable {
  whichEntry: "indexSignature"
  keyName: string
  keyType: "string" | "number"
  type: AstType
  optional?: boolean
  readonly?: boolean
}

export interface AstMappedIndexSignature extends AstCommentable {
  whichEntry: "mappedIndexSignature"
  keyName: string
  keyInType: AstType
  type: AstType
  optional?: boolean
  readonly?: boolean
}

export interface AstNamedType extends AstCommentable {
  whichDeclaration: "type"
  name: string
  type: AstType
  exported?: boolean
}

export type AstType = string
  | AstLiteralType
  | AstInterface
  | AstCompositeType
  | AstTupleType
  | AstArrayType
  | AstGenericType
  | AstFunctionType
  | AstInlineImportType

export interface AstLiteralType {
  whichType: "literal"
  value: string | number | boolean | bigint
  stringDelim?: "\"" | "'" | "`"
}

export interface AstCompositeType {
  whichType: "composite"
  op: "union" | "intersection"
  types: AstType[]
}

export interface AstTupleType {
  whichType: "tuple"
  itemTypes: AstType[]
}

export interface AstArrayType {
  whichType: "array"
  itemType: AstType
  shorthandSyntax?: boolean
}

export interface AstGenericType {
  whichType: "generic"
  name: string
  parameters: AstType[]
}

export interface AstFunctionType {
  whichType: "function"
  parameters: AstParameter[]
  returnValue: AstType
}

export interface AstParameter {
  name: string
  type: AstType
}

export interface AstInlineImportType {
  whichType: "inlineImport"
  from: string
  exportedName: string
}

export interface AstStandaloneComment {
  whichDeclaration: "comment"
  /**
   * A multiline string.
   */
  blockComment: string
}

export interface AstStandaloneInterfaceComment {
  whichEntry: "comment"
  /**
   * A multiline string.
   */
  blockComment: string
}

export interface AstCommentable {
  /**
   * A multiline string.
   */
  blockComment?: string
  inlineComment?: string | string[]
}