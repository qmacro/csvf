#!/usr/bin/env node

const csv = require('@sap/cds/lib/utils/csv')
const {readFile, writeFile} = require('fs')
const err = e => {if (e) throw e}

const optionDefinitions = [
	{ name: 'verbose', alias: 'v', type: Boolean },
	{ name: 'input', alias: 'i', type: String, defaultOption: true },
	{ name: 'output', alias: 'o', type: String, defaultValue: '_out.csv' },
	{ name: 'fields', type: String, multiple: true }
]
const options = require('command-line-args')(optionDefinitions)
const log = (isVerbose => x => isVerbose && console.log(">>", x))(options.verbose)

/* This 'indices' function will return a list of indices for
   values (supplied in 'fields') in a reference array (in 'ref').
   indices('abcde'.split(''))(['b','e','z']) // => [1, 4, -1]
   */
const indices = ref => fields => fields.map(x => ref.indexOf(x))

/* Supply a source (an array) and a array of indices, and
   this 'pick' function will return those elements from the
   source that correspond to the indices supplied.
   pick('abcde'.split(''))([1,3,4]) // => ['b','d','e']
   */
const pick = indices => source =>
	indices.reduce((a, x) => (_ => a)(a.push(source[x])), [])

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


const serialise = (cols, rows, fs=',', ls='\n') => {
	const lines = []
	lines.push(cols.join(fs))
	rows.forEach(x => lines.push(x.join(fs)))
	return lines.join(ls)
}

log(`Processing ${options.input}`)

readFile(options.input, 'utf8', (e, src) => {
	err(e)

	// Use csv parser in the utils section of @sap/cds package
	let [cols, ...rows] = csv.parse(src)

	// What are the indices of the selected columns?
	const selectedIndices = indices(cols)(options.fields)

	// Abort if any of them indicate a not-found field
	if (selectedIndices.find(x => x === -1)) {
		err(`Unrecognised fields: ${missing(cols)(options.fields)}`)
	}
	log(`Filtering to ${options.fields}`)

	// Create the content for the CSV header line
	outCols = pick(selectedIndices)(cols)

	// Write the serialised CSV output
	writeFile(
		options.output,
		serialise(outCols, rows.map(pick(selectedIndices))),
		'utf8',
		e => err(e) || log(`Written to ${options.output}`)
	)

})

