require({
    config: {
        a: {
            id: 'magic'
        },
		text: {
			useXhr: function() {
				return false;
			}
		}
    },
	packages: [
		{"name":"text","location":".","main":"text"}
	]
});

require({
        baseUrl: './',
        config: {
            'b/c': {
                id: 'beans'
            }
        }
    },
    ['a', 'b/c', 'plain', 'text!text.html'],
    function(a, c, plain, text) {
        doh.register(
            'moduleConfig',
            [
                function moduleConfig(t){
                    t.is('magic', a.type);
                    t.is('beans', c.food);
                    t.is('plain', plain.id);
					t.is('NOT Xhr', text);
                }
            ]
        );
        doh.run();
    }
);
