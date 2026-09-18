import { Language } from '@putong-oj/shared'
import test from 'ava'
import { LanguageRegistry } from '../src/modules/judger/languages/registry.ts'

test('rejects duplicate language registration', (t) => {
  t.throws(() => {
    LanguageRegistry.register(Language.C, {
      sourceFilename: 'Main.c',
      compiledFilename: 'Main',
      needCompile: true,
      compileCmd: [],
      runCmd: [],
      timeFactor: 1,
      memoryFactor: 1,
    })
  })
})

test('rejects an unregistered language', (t) => {
  t.throws(() => LanguageRegistry.getConfig(-1 as Language))
})

test('keeps the Python language configuration', (t) => {
  const config = LanguageRegistry.getConfig(Language.Python)
  t.is(config.sourceFilename, 'Main.py')
  t.is(config.compiledFilename, 'Main.pyc')
  t.deepEqual(config.runCmd, [ '/usr/bin/python3.11', 'Main.pyc' ])
})

test('keeps the Java language multipliers', (t) => {
  const config = LanguageRegistry.getConfig(Language.Java)
  t.is(config.timeFactor, 2)
  t.is(config.memoryFactor, 2)
})
