import pkg from './package.json' with {type:'json'}

export default  {
	// import name from package.json
	name: pkg.name,
	triggers: {
		keywords: [
			'tourist attraction',
			'tourist attractions',
			'things to do',
			'places to visit',
			'landmarks',
			'sights',
			'museum',
			'museums',
			'castle',           
            'castles',          
            'memorial',         
            'memorials',
			'archaeological site',
			'archaeological sites',
			'historic place',
			'historic places',
			'historical site',
			'historical sites',
			'points of interest'
		]
		// in the future, we can add other types of triggers
	},
	query_format: {
		regex: [
			'tourist\\s+attractions?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'things\\s+to\\s+do\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'places\\s+to\\s+visit\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'landmarks\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'sights\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'museums?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'castles?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',     
    'memorials?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*', 
			'archaeological\\s+sites?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'historic\\s+places?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'historical\\s+sites?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
			'points\\s+of\\s+interest\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*'
		]
		// in the future, we can add other types of query formats
	},
	client: {
		// location of client side code
		// should point to pkg.umd - but currently that points to dist/index.umd.js
		location: pkg.module,
		// name of the UMD module
		moduleName: pkg.umdName || 'HD' + pkg.name,
		// baseURL is only used in local testing and ignored after publish
		// Optional: defaults to '/name' (the name of the component)
		baseURL: '/' + pkg.name,

	},
	format: {
		mainline: true,
		sidebar: true
		// "sidebar" / "mainline" / "ribbon" / "fullscreen"
	},
	permissions: {
		
	},
	info: {
		// key-values added here will be added to the compInfo section of searchData
	}
}
