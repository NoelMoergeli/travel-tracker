import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

export interface CountryOption {
	code: string;
	name: string;
}

const aliases = new Map<string, string>([
	['Bolivia', 'BO'],
	['Brunei', 'BN'],
	['Cape Verde', 'CV'],
	['Democratic Republic of the Congo', 'CD'],
	['Republic of the Congo', 'CG'],
	['Czech Republic', 'CZ'],
	['Iran', 'IR'],
	['Ivory Coast', 'CI'],
	['Laos', 'LA'],
	['Moldova', 'MD'],
	['North Korea', 'KP'],
	['Russia', 'RU'],
	['South Korea', 'KR'],
	['Syria', 'SY'],
	['Tanzania', 'TZ'],
	['United States of America', 'US'],
	['Venezuela', 'VE'],
	['Vietnam', 'VN']
]);

export function getCountryOptions(): CountryOption[] {
	return Object.keys(countries.getAlpha2Codes())
		.map((code) => ({ code, name: countries.getName(code, 'en') ?? code }))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function getCountryName(code: string): string {
	return countries.getName(code.toUpperCase(), 'en') ?? code.toUpperCase();
}

export function getCountryCode(name: string): string | null {
	return countries.getAlpha2Code(name, 'en') ?? aliases.get(name) ?? null;
}
