import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Organic Certification API - Alex Kimeu',
			version: '1.0.0',
			description: `
        REST API for managing organic farm certifications.
        
        This API allows agronomists to:
        - Register farmers, farms, and fields
        - Conduct inspections with compliance checklists
        - Generate and manage organic certificates
        
        ## Rate Limiting
        - General endpoints: 100 requests per 15 minutes per IP
        
        ## Error Responses
        All error responses follow a consistent format:
        \`\`\`json
        {
          "success": false,
          "error": "Error Type",
          "message": "Human readable error message",
          "statusCode": 400,
          "timestamp": "2023-09-12T10:30:00.000Z",
          "path": "/api/farmers"
        }
        \`\`\`
      `,
			contact: {
				name: 'API Support',
				email: 'alexkimeu1999@gmail.com',
			},
			license: {
				name: 'MIT',
				url: 'https://opensource.org/licenses/MIT',
			},
		},
		servers: [
			{
				url: 'https://organiccertifications.online',
				description: 'Production server',
			},
		],
		components: {
			responses: {
				BadRequest: {
					description: 'Bad Request - Invalid input data',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean', example: false },
									error: { type: 'string', example: 'Validation Error' },
									message: { type: 'string', example: 'Invalid input data' },
									statusCode: { type: 'number', example: 400 },
									timestamp: { type: 'string', format: 'date-time' },
									path: { type: 'string', example: '/api/farmers' },
								},
							},
						},
					},
				},
				NotFound: {
					description: 'Not Found - Resource does not exist',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean', example: false },
									error: { type: 'string', example: 'Not Found' },
									message: { type: 'string', example: 'Resource not found' },
									statusCode: { type: 'number', example: 404 },
								},
							},
						},
					},
				},
				Conflict: {
					description: 'Conflict - Resource already exists',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean', example: false },
									error: { type: 'string', example: 'Conflict' },
									message: { type: 'string', example: 'Resource already exists' },
									statusCode: { type: 'number', example: 409 },
								},
							},
						},
					},
				},
				RateLimitExceeded: {
					description: 'Too Many Requests - Rate limit exceeded',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean', example: false },
									error: { type: 'string', example: 'Rate Limit Exceeded' },
									message: { type: 'string', example: 'Too many requests' },
									statusCode: { type: 'number', example: 429 },
									retryAfter: { type: 'number', example: 900 },
								},
							},
						},
					},
				},
				InternalServerError: {
					description: 'Internal Server Error',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									success: { type: 'boolean', example: false },
									error: { type: 'string', example: 'Internal Server Error' },
									message: { type: 'string', example: 'An unexpected error occurred' },
									statusCode: { type: 'number', example: 500 },
								},
							},
						},
					},
				},
			},
			schemas: {
				KenyanCounty: {
					type: 'string',
					enum: [
						'Baringo',
						'Bomet',
						'Bungoma',
						'Busia',
						'Elgeyo-Marakwet',
						'Embu',
						'Garissa',
						'Homa Bay',
						'Isiolo',
						'Kajiado',
						'Kakamega',
						'Kericho',
						'Kiambu',
						'Kilifi',
						'Kirinyaga',
						'Kisii',
						'Kisumu',
						'Kitui',
						'Kwale',
						'Laikipia',
						'Lamu',
						'Machakos',
						'Makueni',
						'Mandera',
						'Marsabit',
						'Meru',
						'Migori',
						'Mombasa',
						"Murang'a",
						'Nairobi',
						'Nakuru',
						'Nandi',
						'Narok',
						'Nyamira',
						'Nyandarua',
						'Nyeri',
						'Samburu',
						'Siaya',
						'Taita-Taveta',
						'Tana River',
						'Tharaka-Nithi',
						'Trans Nzoia',
						'Turkana',
						'Uasin Gishu',
						'Vihiga',
						'Wajir',
						'West Pokot',
					],
					example: 'Nairobi',
				},
				Farmer: {
					type: 'object',
					properties: {
						id: { type: 'string', example: 'cm123abc456def' },
						name: { type: 'string', example: 'John Doe' },
						phone: { type: 'string', example: '+254712345678' },
						email: { type: 'string', format: 'email', example: 'john.doe@email.com' },
						county: { $ref: '#/components/schemas/KenyanCounty' },
						createdAt: { type: 'string', format: 'date-time', example: '2023-09-12T10:30:00.000Z' },
						updatedAt: { type: 'string', format: 'date-time', example: '2023-09-12T10:30:00.000Z' },
					},
				},
				SuccessResponse: {
					type: 'object',
					properties: {
						success: { type: 'boolean', example: true },
						message: { type: 'string', example: 'Operation completed successfully' },
						data: {
							oneOf: [{ $ref: '#/components/schemas/Farmer' }, { type: 'null' }],
						},
					},
				},
				PaginatedResponse: {
					type: 'object',
					properties: {
						success: { type: 'boolean', example: true },
						data: {
							type: 'array',
							items: { $ref: '#/components/schemas/Farmer' },
						},
						pagination: {
							type: 'object',
							properties: {
								page: { type: 'number', example: 1 },
								limit: { type: 'number', example: 10 },
								total: { type: 'number', example: 100 },
								totalPages: { type: 'number', example: 10 },
							},
						},
					},
				},
			},
			parameters: {
				PageParam: {
					name: 'page',
					in: 'query',
					description: 'Page number for pagination (starts from 1)',
					required: false,
					schema: {
						type: 'integer',
						minimum: 1,
						default: 1,
					},
				},
				LimitParam: {
					name: 'limit',
					in: 'query',
					description: 'Number of items per page',
					required: false,
					schema: {
						type: 'integer',
						minimum: 1,
						maximum: 100,
						default: 10,
					},
				},
				SearchParam: {
					name: 'search',
					in: 'query',
					description: 'Search term for filtering results',
					required: false,
					schema: {
						type: 'string',
						minLength: 1,
						maxLength: 100,
					},
				},
				SortParam: {
					name: 'sort',
					in: 'query',
					description: 'Sort field and order (e.g., "name:asc", "createdAt:desc")',
					required: false,
					schema: {
						type: 'string',
						pattern: '^[a-zA-Z_][a-zA-Z0-9_]*:(asc|desc)$',
					},
				},
			},
		},
		tags: [
			{
				name: 'Health',
				description: 'System health and status endpoints',
			},
			{
				name: 'Farmers',
				description: 'Farmer registration and management',
			},
			{
				name: 'Farms',
				description: 'Farm information and management',
			},
			{
				name: 'Fields',
				description: 'Field details and crop information',
			},
			{
				name: 'Inspections',
				description: 'Compliance inspections and scoring',
			},
			{
				name: 'Certificates',
				description: 'Organic certificate generation and management',
			},
		],
	},
	apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/app.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const swaggerUiOptions = {
	explorer: true,
	swaggerOptions: {
		filter: true,
		showRequestDuration: true,
		showCommonExtensions: true,
		showExtensions: true,
		tryItOutEnabled: true,
	},
	customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .scheme-container { margin: 0; padding: 10px 0; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 2.2em; }
  `,
	customSiteTitle: 'Organic Certification API Documentation',
};
