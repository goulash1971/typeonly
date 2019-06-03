import { ArrayType, CompositeType, Interface, LiteralType, Modules, Property, TupleType, Type, TypeName } from "../typeonly-reader"
import { readModules, ReadModulesOptions } from "../typeonly-reader/reader-api"

export interface CheckResult {
  conform: boolean
  error?: string
}

type InternalResult = { done: true, unmatch?: undefined } | {
  done: false,
  unmatch: Unmatch
}

interface Unmatch {
  val: unknown,
  type: Type
}

export async function createChecker(options: ReadModulesOptions) {
  return new Checker(await readModules(options))
}

export default class Checker {
  private typeCheckers: {
    [K in Type["kind"]]: (type: any, val: unknown) => InternalResult
  } = {
      name: (type, val) => this.checkTypeName(type, val),
      interface: (type, val) => this.checkInterface(type, val),
      array: (type, val) => this.checkArrayType(type, val),
      composite: (type, val) => this.checkCompositeType(type, val),
      function: (type, val) => this.checkFunctionType(type, val),
      genericInstance: (type, val) => this.checkGenericInstance(type, val),
      genericParameterName: (type, val) => this.checkGenericParameterName(type, val),
      importedRef: (type, val) => this.checkImportedTypeRef(type, val),
      keyof: (type, val) => this.checkKeyofType(type, val),
      literal: (type, val) => this.checkLiteralType(type, val),
      localRef: (type, val) => this.checkLocalTypeRef(type, val),
      member: (type, val) => this.checkMemberType(type, val),
      tuple: (type, val) => this.checkTupleType(type, val),

    }

  constructor(private modules: Modules) {
  }

  check(moduleName: string, typeName: string, val: unknown): CheckResult {
    const module = this.modules[moduleName]
    if (!module)
      throw new Error(`Unknown module: ${moduleName}`)
    const namedType = module.namedTypes[typeName]
    if (!namedType)
      throw new Error(`Unknown type: ${typeName}`)
    const result = this.checkType(namedType, val)

    if (result.done)
      return { conform: true }

    return {
      conform: false,
      error: `Expected type ${result.unmatch.type.kind}, received: '${typeof result.unmatch.val}'.`
    }
  }

  private checkType(type: Type, val: unknown): InternalResult {
    const checker = this.typeCheckers[type.kind]
    if (!checker)
      throw new Error(`Unexpected kind: ${type.kind}`)
    return checker(type, val)
  }

  private checkTypeName(type: TypeName, val: unknown): InternalResult {
    if (type.group === "primitive") {
      console.log(type)
      if (typeof val !== type.refName) {
        return { done: false, unmatch: { type, val } }
      }
      return { done: true }
    }

    if (type.group === "ts") {
      if (type.refName === "object" && typeof val !== "object") {
        return { done: false, unmatch: { type, val } }
      }
      if (type.refName === "void" && typeof val !== undefined) {
        return { done: false, unmatch: { type, val } }
      }
      if (type.refName === "never") {
        return { done: false, unmatch: { type, val } }
      }

      return { done: true }
    }

    if (type.group === "standard")
      throw new Error(`Not yet implemented.`)


    if (type.group === "global")
      throw new Error(`Not yet implemented.`)

    return { done: false, unmatch: { type, val } }
  }

  private checkInterface(type: Interface, val: unknown): InternalResult {
    if (!val || typeof val !== "object") {
      return { done: false, unmatch: { type, val } }
    }

    const obj = val as object
    const remaining = new Set(Object.keys(obj))

    for (const property of Object.values(type.properties)) {
      remaining.delete(property.name)
      const prop = obj[property.name]
      if (prop === undefined) {
        if (!property.optional) {
          // this.lastError = `Required property '${property.name}'`
          return { done: false, unmatch: { type, val } }
        }
      } else {
        const childResult = this.checkType(property.type, prop)
        if (!childResult.done)
          return childResult
      }
    }

    if (remaining.size > 0) {
      // this.lastError = `Unexpected properties: ${Array.from(remaining.values()).join(", ")}`
      return { done: false, unmatch: { type, val } }
    }

    return { done: true }
  }

  private checkLiteralType(type: LiteralType, val: unknown): InternalResult {
    if (type.literal !== val)
      return { done: false, unmatch: { type, val } }
    return { done: true }
  }

  private checkArrayType(type: ArrayType, val: unknown): InternalResult {
    if (!Array.isArray(val))
      return { done: false, unmatch: { type, val } }

    for (const item of val) {
      const childResult = this.checkType(type.itemType, item)
      if (!childResult.done)
        return childResult
    }
    return { done: true }
  }

  private checkTupleType(type: TupleType, val: unknown): InternalResult {
    if (!Array.isArray(val))
      return { done: false, unmatch: { type, val } }

    const items = type.itemTypes
    if (val.length !== items.length) {
      // this.lastError = `Invalid tuple size: expected ${items.length}, received: '${val.length}'.`
      return { done: false, unmatch: { type, val } }
    }

    for (const [index, item] of items.entries()) {
      const prop = val[index]
      const childResult = this.checkType(item, prop)
      if (!childResult.done)
        return childResult
    }

    return { done: true }
  }
  private checkCompositeType(type: CompositeType, val: unknown): InternalResult {
    if (type.op === "union") {
      for (const itemType of type.types) {
        if (this.checkType(itemType, val).done)
          return { done: true }
      }

      // this.lastError = `Expected types '${Array.from(type.types.values()).join(" or ")}', received: '${typeof val}'.`
      return { done: false, unmatch: { type, val } }

    } else {

      // this.lastError = `Expected types '${type.types}', received: '${typeof val}'.`
      return { done: false, unmatch: { type, val } }
    }
  }


  private checkFunctionType(type: any, val: unknown): InternalResult {
    // TODO
    throw new Error("Method not implemented.")
  }
  private checkGenericInstance(type: any, val: unknown): InternalResult {
    // TODO
    throw new Error("Method not implemented.")
  }
  private checkGenericParameterName(type: any, val: unknown): InternalResult {
    // TODO
    throw new Error("Method not implemented.")
  }
  private checkImportedTypeRef(type: any, val: unknown): InternalResult {
    // TODO
    throw new Error("Method not implemented.")
  }
  private checkKeyofType(type: any, val: unknown): InternalResult {
    // TODO
    throw new Error("Method not implemented.")
  }
  private checkLocalTypeRef(type: any, val: unknown): InternalResult {
    // TODO
    throw new Error("Method not implemented.")
  }
  private checkMemberType(type: any, val: unknown): InternalResult {
    // TODO
    throw new Error("Method not implemented.")
  }


}
