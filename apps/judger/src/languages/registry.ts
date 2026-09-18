import { Language } from '@putong-oj/shared'

export interface LanguageConfig {
  sourceFilename: string
  compiledFilename: string
  needCompile: boolean
  compileCmd: string[]
  runCmd: string[]
  timeFactor: number
  memoryFactor: number
}

const languageConfigs = new Map<Language, LanguageConfig>()

export class LanguageRegistry {
  static register (language: Language, config: LanguageConfig): void {
    if (languageConfigs.has(language)) {
      throw new TypeError(`Language ${language} is already registered`)
    }
    languageConfigs.set(language, config)
  }

  static getConfig (language: Language): LanguageConfig {
    const config = languageConfigs.get(language)
    if (!config) {
      throw new TypeError(`Language ${language} is not registered`)
    }
    return config
  }
}

LanguageRegistry.register(Language.C, {
  sourceFilename: 'Main.c',
  compiledFilename: 'Main',
  needCompile: true,
  compileCmd: [
    '/usr/bin/gcc-12', 'Main.c', '-o', 'Main',
    '-std=c11', '-O2', '-lm', '-DONLINE_JUDGE',
    '-w', '-fmax-errors=3', '--static',
  ],
  runCmd: [ './Main' ],
  timeFactor: 1,
  memoryFactor: 1,
})

LanguageRegistry.register(Language.Cpp11, {
  sourceFilename: 'Main.cpp',
  compiledFilename: 'Main',
  needCompile: true,
  compileCmd: [
    '/usr/bin/g++-12', 'Main.cpp', '-o', 'Main',
    '-std=c++11', '-O2', '-lm', '-DONLINE_JUDGE',
    '-w', '-fmax-errors=3', '--static',
  ],
  runCmd: [ './Main' ],
  timeFactor: 1,
  memoryFactor: 1,
})

LanguageRegistry.register(Language.Cpp17, {
  sourceFilename: 'Main.cpp',
  compiledFilename: 'Main',
  needCompile: true,
  compileCmd: [
    '/usr/bin/g++-12', 'Main.cpp', '-o', 'Main',
    '-std=c++17', '-O2', '-lm', '-DONLINE_JUDGE',
    '-w', '-fmax-errors=3', '--static',
  ],
  runCmd: [ './Main' ],
  timeFactor: 1,
  memoryFactor: 1,
})

LanguageRegistry.register(Language.Java, {
  sourceFilename: 'Main.java',
  compiledFilename: 'Main.jar',
  needCompile: true,
  compileCmd: [
    '/usr/bin/bash', '-c',
    '/usr/bin/javac Main.java -encoding UTF-8 && /usr/bin/jar cvf Main.jar *.class',
  ],
  runCmd: [
    '/usr/bin/java', '-DONLINE_JUDGE', '-cp', 'Main.jar', 'Main',
  ],
  timeFactor: 2,
  memoryFactor: 2,
})

LanguageRegistry.register(Language.Python, {
  sourceFilename: 'Main.py',
  compiledFilename: 'Main.pyc',
  needCompile: true,
  compileCmd: [
    '/usr/bin/bash', '-c',
    '/usr/bin/python3.11 -m py_compile Main.py && mv __pycache__/Main.cpython-311.pyc Main.pyc',
  ],
  runCmd: [
    '/usr/bin/python3.11', 'Main.pyc',
  ],
  timeFactor: 1,
  memoryFactor: 1,
})

LanguageRegistry.register(Language.PyPy, {
  sourceFilename: 'Main.py',
  compiledFilename: 'Main.pyc',
  needCompile: true,
  compileCmd: [
    '/usr/bin/bash', '-c',
    '/usr/bin/pypy3 -m py_compile Main.py && mv __pycache__/Main.pypy39.pyc Main.pyc',
  ],
  runCmd: [
    '/usr/bin/pypy3', 'Main.pyc',
  ],
  timeFactor: 1,
  memoryFactor: 1,
})
