#!/usr/bin/env node

const csv = require('@sap/cds/lib/utils/csv')
const {readFile} = require('fs')
const err = e => {if (e) throw e}

const optionDefinitions = [
	{ name: 'verbose', alias: 'v', type: Boolean },
	{ name: 'input', alias: 'i', type: String, defaultOption: true },
	{ name: 'fields', type: String, multiple: true }
]
const options = require('command-line-args')(optionDefinitions)

/* This will produce a function that will say which (if any)
   of a list of fields ('fields') are missing from a reference
   list of fields ('ref'). We'll use this to check whether any
   fields specified at invocation are not amongst the actual
   columns defined in the input CSV file.
   */
const missing = ref => fields => fields.reduce((a, x) => {
	if (ref.indexOf(x) === -1) { a.push(x) }
	return a
}, [])

options.verbose && console.log(`Processing ${options.input}`)

readFile(options.input, 'utf8', (e, src) => {
	err(e)
	let [cols, ...rows] = csv.parse(src)
	const fieldsNotFound = missing(cols)(options.fields)
	fieldsNotFound.length && err(`Unrecognised fields: ${fieldsNotFound}`)
	options.verbose && console.log(`Filtering to ${options.fields}`)
})


