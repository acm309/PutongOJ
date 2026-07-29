import { z } from 'zod'

export const stringToNumber = z.codec(
  z.string().regex(z.regexes.number),
  z.number(),
  {
    decode: str => Number.parseFloat(str),
    encode: num => num.toString(),
  },
)

export const stringToInt = z.codec(
  z.string().regex(z.regexes.integer),
  z.int(),
  {
    decode: str => Number.parseInt(str, 10),
    encode: num => num.toString(),
  },
)

export const isoDatetimeToDate = z.codec(
  z.iso.datetime(),
  z.date(),
  {
    decode: isoString => new Date(isoString),
    encode: date => date.toISOString(),
  },
)

export const epochMillisToDate = z.codec(
  z.int().min(0),
  z.date(),
  {
    decode: millis => new Date(millis),
    encode: date => date.getTime(),
  },
)
