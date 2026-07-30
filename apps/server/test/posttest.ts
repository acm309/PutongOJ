import process from 'node:process'
import { resetDatabase } from './helper'

void resetDatabase().then(() => process.exit(0))
