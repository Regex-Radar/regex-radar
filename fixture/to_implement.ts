// These examples still require detection to be implemented

// using array.join to build a multiline regex (usually to document or clarify)
const multiLineBuild = new RegExp(
    [
        '^\\d{4}-', // year
        '\\d{2}-', // month
        '\\d{2}$', // day
    ].join(''),
);

// using template strings

const template_regexp_fn = RegExp(`pattern`, 'g');
const template_regexp_new = new RegExp(`pattern`, 'g');

// using multiline template strings
const template_multiline_regexp_fn = RegExp(`pattern`, 'g');
const template_multiline_regexp_new = new RegExp(`pattern`, 'g');

// using template strings with variable substitution
const templatePattern = new RegExp(`^item-(\\d+)-${process.env.NODE_ENV}$`);

// using multiline template strings with variable substitution

export {};
