# API Routes Documentation

Generated from Laravel route list on 2026-02-18.

## Base Info
- Base URL: `https://<your-domain>`
- API prefix: `/api`
- Auth: `Authorization: Bearer <token>` for routes where `Auth=Yes`
- Response format: JSON
- Total API routes: 217
- Route groups (by first URI segment): 38
- Source of truth command: `php artisan route:list --path=api --json`

## Conventions
- `Auth=Yes`: route protected by Sanctum (`auth:sanctum`).
- `active-user`: user must pass `EnsureUserIsActive` middleware.
- Dynamic params are shown as `{param}`.

## b24
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/b24/token` | No | - | `B24AuthController@issue` |

## bookings
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/bookings` | Yes | auth:sanctum, active-user | `BookingController@index` |
| POST | `/api/bookings` | Yes | auth:sanctum, active-user | `BookingController@store` |
| GET|HEAD | `/api/bookings/agents-report` | Yes | auth:sanctum, active-user | `BookingController@agentsReport` |
| GET|HEAD | `/api/bookings/{id}` | Yes | auth:sanctum, active-user | `BookingController@show` |
| PUT | `/api/bookings/{id}` | Yes | auth:sanctum, active-user | `BookingController@update` |

## branches
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/branches` | No | - | `BranchController@index` |
| POST | `/api/branches` | Yes | auth:sanctum, active-user | `BranchController@store` |
| DELETE | `/api/branches/{branch}` | Yes | auth:sanctum, active-user | `BranchController@destroy` |
| GET|HEAD | `/api/branches/{branch}` | Yes | auth:sanctum, active-user | `BranchController@show` |
| PUT|PATCH | `/api/branches/{branch}` | Yes | auth:sanctum, active-user | `BranchController@update` |

## building-types
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/building-types` | No | - | `BuildingTypeController@index` |
| POST | `/api/building-types` | Yes | auth:sanctum, active-user | `BuildingTypeController@store` |
| DELETE | `/api/building-types/{building_type}` | Yes | auth:sanctum, active-user | `BuildingTypeController@destroy` |
| GET|HEAD | `/api/building-types/{building_type}` | Yes | auth:sanctum, active-user | `BuildingTypeController@show` |
| PUT|PATCH | `/api/building-types/{building_type}` | Yes | auth:sanctum, active-user | `BuildingTypeController@update` |

## car-brands
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/car-brands` | No | - | `CarBrandController@index` |
| POST | `/api/car-brands` | Yes | auth:sanctum, active-user | `CarBrandController@store` |
| DELETE | `/api/car-brands/{car_brand}` | Yes | auth:sanctum, active-user | `CarBrandController@destroy` |
| GET|HEAD | `/api/car-brands/{car_brand}` | Yes | auth:sanctum, active-user | `CarBrandController@show` |
| PUT|PATCH | `/api/car-brands/{car_brand}` | Yes | auth:sanctum, active-user | `CarBrandController@update` |

## car-categories
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/car-categories` | No | - | `CarCategoryController@index` |
| POST | `/api/car-categories` | Yes | auth:sanctum, active-user | `CarCategoryController@store` |
| DELETE | `/api/car-categories/{car_category}` | Yes | auth:sanctum, active-user | `CarCategoryController@destroy` |
| GET|HEAD | `/api/car-categories/{car_category}` | Yes | auth:sanctum, active-user | `CarCategoryController@show` |
| PUT|PATCH | `/api/car-categories/{car_category}` | Yes | auth:sanctum, active-user | `CarCategoryController@update` |

## car-models
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/car-models` | No | - | `CarModelController@index` |
| POST | `/api/car-models` | Yes | auth:sanctum, active-user | `CarModelController@store` |
| DELETE | `/api/car-models/{car_model}` | Yes | auth:sanctum, active-user | `CarModelController@destroy` |
| GET|HEAD | `/api/car-models/{car_model}` | Yes | auth:sanctum, active-user | `CarModelController@show` |
| PUT|PATCH | `/api/car-models/{car_model}` | Yes | auth:sanctum, active-user | `CarModelController@update` |

## cars
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/cars` | No | - | `CarController@index` |
| POST | `/api/cars` | Yes | auth:sanctum, active-user | `CarController@store` |
| DELETE | `/api/cars/{car}` | Yes | auth:sanctum, active-user | `CarController@destroy` |
| GET|HEAD | `/api/cars/{car}` | No | - | `CarController@show` |
| PUT | `/api/cars/{car}` | Yes | auth:sanctum, active-user | `CarController@update` |
| PATCH | `/api/cars/{car}/moderation` | Yes | auth:sanctum, active-user | `CarController@moderate` |
| POST | `/api/cars/{car}/photos` | Yes | auth:sanctum, active-user | `CarPhotoController@store` |
| PUT | `/api/cars/{car}/photos/reorder` | Yes | auth:sanctum, active-user | `CarPhotoController@reorder` |
| DELETE | `/api/cars/{car}/photos/{photo}` | Yes | auth:sanctum, active-user | `CarPhotoController@destroy` |
| POST | `/api/cars/{car}/photos/{photo}/cover` | Yes | auth:sanctum, active-user | `CarPhotoController@setCover` |
| POST | `/api/cars/{car}/refresh-publication` | Yes | auth:sanctum, active-user | `CarController@refreshPublication` |

## chat
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/chat` | No | - | `ChatController@handle` |
| POST | `/api/chat/feedback` | Yes | auth:sanctum, active-user | `ChatController@feedback` |
| GET|HEAD | `/api/chat/history` | No | - | `ChatController@history` |

## construction-stages
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/construction-stages` | No | - | `ConstructionStageController@index` |
| POST | `/api/construction-stages` | Yes | auth:sanctum, active-user | `ConstructionStageController@store` |
| DELETE | `/api/construction-stages/{construction_stage}` | Yes | auth:sanctum, active-user | `ConstructionStageController@destroy` |
| GET|HEAD | `/api/construction-stages/{construction_stage}` | No | - | `ConstructionStageController@show` |
| PUT|PATCH | `/api/construction-stages/{construction_stage}` | Yes | auth:sanctum, active-user | `ConstructionStageController@update` |

## contract-types
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/contract-types` | No | - | `ContractTypeController@index` |
| POST | `/api/contract-types` | Yes | auth:sanctum, active-user | `ContractTypeController@store` |
| DELETE | `/api/contract-types/{contract_type}` | Yes | auth:sanctum, active-user | `ContractTypeController@destroy` |
| GET|HEAD | `/api/contract-types/{contract_type}` | Yes | auth:sanctum, active-user | `ContractTypeController@show` |
| PUT|PATCH | `/api/contract-types/{contract_type}` | Yes | auth:sanctum, active-user | `ContractTypeController@update` |

## developers
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/developers` | No | - | `DeveloperController@index` |
| POST | `/api/developers` | Yes | auth:sanctum, active-user | `DeveloperController@store` |
| DELETE | `/api/developers/{developer}` | Yes | auth:sanctum, active-user | `DeveloperController@destroy` |
| GET|HEAD | `/api/developers/{developer}` | No | - | `DeveloperController@show` |
| PUT|PATCH | `/api/developers/{developer}` | Yes | auth:sanctum, active-user | `DeveloperController@update` |

## direct-chat
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/direct-chat/sessions` | Yes | auth:sanctum, active-user | `DirectChatController@sessions` |
| POST | `/api/direct-chat/sessions` | Yes | auth:sanctum, active-user | `DirectChatController@createSession` |
| POST | `/api/direct-chat/sessions/{session}/delivered` | Yes | auth:sanctum, active-user | `DirectChatController@markDelivered` |
| GET|HEAD | `/api/direct-chat/sessions/{session}/messages` | Yes | auth:sanctum, active-user | `DirectChatController@messages` |
| POST | `/api/direct-chat/sessions/{session}/messages` | Yes | auth:sanctum, active-user | `DirectChatController@sendMessage` |
| POST | `/api/direct-chat/sessions/{session}/read` | Yes | auth:sanctum, active-user | `DirectChatController@markRead` |
| POST | `/api/direct-chat/sessions/{session}/seen` | Yes | auth:sanctum, active-user | `DirectChatController@markSeen` |

## favorites
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/favorites` | Yes | auth:sanctum, active-user | `FavoriteController@index` |
| POST | `/api/favorites` | Yes | auth:sanctum, active-user | `FavoriteController@store` |
| DELETE | `/api/favorites/{property_id}` | Yes | auth:sanctum, active-user | `FavoriteController@destroy` |

## features
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/features` | No | - | `FeatureController@index` |
| POST | `/api/features` | Yes | auth:sanctum, active-user | `FeatureController@store` |
| DELETE | `/api/features/{feature}` | Yes | auth:sanctum, active-user | `FeatureController@destroy` |
| GET|HEAD | `/api/features/{feature}` | No | - | `FeatureController@show` |
| PUT|PATCH | `/api/features/{feature}` | Yes | auth:sanctum, active-user | `FeatureController@update` |

## heating-types
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/heating-types` | No | - | `HeatingTypeController@index` |
| POST | `/api/heating-types` | Yes | auth:sanctum, active-user | `HeatingTypeController@store` |
| DELETE | `/api/heating-types/{heating_type}` | Yes | auth:sanctum, active-user | `HeatingTypeController@destroy` |
| GET|HEAD | `/api/heating-types/{heating_type}` | Yes | auth:sanctum, active-user | `HeatingTypeController@show` |
| PUT|PATCH | `/api/heating-types/{heating_type}` | Yes | auth:sanctum, active-user | `HeatingTypeController@update` |

## lead-requests
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/lead-requests` | No | Illuminate\Routing\Middleware\ThrottleRequests:20,1 | `LeadRequestController@store` |

## locations
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/locations` | No | - | `LocationController@index` |
| POST | `/api/locations` | Yes | auth:sanctum, active-user | `LocationController@store` |
| DELETE | `/api/locations/{location}` | Yes | auth:sanctum, active-user | `LocationController@destroy` |
| GET|HEAD | `/api/locations/{location}` | Yes | auth:sanctum, active-user | `LocationController@show` |
| PUT|PATCH | `/api/locations/{location}` | Yes | auth:sanctum, active-user | `LocationController@update` |

## login
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/login` | No | - | `AuthController@login` |

## logout
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/logout` | Yes | auth:sanctum, active-user | `AuthController@logout` |

## materials
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/materials` | No | - | `MaterialController@index` |
| POST | `/api/materials` | Yes | auth:sanctum, active-user | `MaterialController@store` |
| DELETE | `/api/materials/{material}` | Yes | auth:sanctum, active-user | `MaterialController@destroy` |
| GET|HEAD | `/api/materials/{material}` | No | - | `MaterialController@show` |
| PUT|PATCH | `/api/materials/{material}` | Yes | auth:sanctum, active-user | `MaterialController@update` |

## moderation
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/moderation/bulk` | Yes | auth:sanctum, active-user | `ModerationController@bulk` |
| PATCH | `/api/moderation/cars/{car}` | Yes | auth:sanctum, active-user | `ModerationController@moderateCar` |
| PATCH | `/api/moderation/properties/{property}` | Yes | auth:sanctum, active-user | `ModerationController@moderateProperty` |
| GET|HEAD | `/api/moderation/queue` | Yes | auth:sanctum, active-user | `ModerationController@queue` |

## my-properties
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/my-properties` | Yes | auth:sanctum, active-user | `PropertyController@myProperties` |

## new-buildings
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/new-buildings` | No | - | `NewBuildingController@index` |
| POST | `/api/new-buildings` | Yes | auth:sanctum, active-user | `NewBuildingController@store` |
| DELETE | `/api/new-buildings/{new_building}` | Yes | auth:sanctum, active-user | `NewBuildingController@destroy` |
| GET|HEAD | `/api/new-buildings/{new_building}` | No | - | `NewBuildingController@show` |
| PUT|PATCH | `/api/new-buildings/{new_building}` | Yes | auth:sanctum, active-user | `NewBuildingController@update` |
| GET|HEAD | `/api/new-buildings/{new_building}/blocks` | No | - | `NewBuildingBlockController@index` |
| POST | `/api/new-buildings/{new_building}/blocks` | Yes | auth:sanctum, active-user | `NewBuildingBlockController@store` |
| DELETE | `/api/new-buildings/{new_building}/blocks/{block}` | Yes | auth:sanctum, active-user | `NewBuildingBlockController@destroy` |
| GET|HEAD | `/api/new-buildings/{new_building}/blocks/{block}` | No | - | `NewBuildingBlockController@show` |
| PUT|PATCH | `/api/new-buildings/{new_building}/blocks/{block}` | Yes | auth:sanctum, active-user | `NewBuildingBlockController@update` |
| DELETE | `/api/new-buildings/{new_building}/features/{feature}` | Yes | auth:sanctum, active-user | `NewBuildingController@detachFeature` |
| POST | `/api/new-buildings/{new_building}/features/{feature}` | Yes | auth:sanctum, active-user | `NewBuildingController@attachFeature` |
| GET|HEAD | `/api/new-buildings/{new_building}/photos` | No | - | `NewBuildingPhotoController@index` |
| POST | `/api/new-buildings/{new_building}/photos` | Yes | auth:sanctum, active-user | `NewBuildingPhotoController@store` |
| PUT | `/api/new-buildings/{new_building}/photos/reorder` | Yes | auth:sanctum, active-user | `NewBuildingPhotoController@reorder` |
| DELETE | `/api/new-buildings/{new_building}/photos/{photo}` | Yes | auth:sanctum, active-user | `NewBuildingPhotoController@destroy` |
| POST | `/api/new-buildings/{new_building}/photos/{photo}/cover` | Yes | auth:sanctum, active-user | `NewBuildingPhotoController@setCover` |
| GET|HEAD | `/api/new-buildings/{new_building}/units` | No | - | `DeveloperUnitController@index` |
| POST | `/api/new-buildings/{new_building}/units` | Yes | auth:sanctum, active-user | `DeveloperUnitController@store` |
| DELETE | `/api/new-buildings/{new_building}/units/{unit}` | Yes | auth:sanctum, active-user | `DeveloperUnitController@destroy` |
| GET|HEAD | `/api/new-buildings/{new_building}/units/{unit}` | No | - | `DeveloperUnitController@show` |
| PUT|PATCH | `/api/new-buildings/{new_building}/units/{unit}` | Yes | auth:sanctum, active-user | `DeveloperUnitController@update` |
| GET|HEAD | `/api/new-buildings/{new_building}/units/{unit}/photos` | Yes | auth:sanctum, active-user | `DeveloperUnitPhotoController@index` |
| POST | `/api/new-buildings/{new_building}/units/{unit}/photos` | Yes | auth:sanctum, active-user | `DeveloperUnitPhotoController@store` |
| PUT | `/api/new-buildings/{new_building}/units/{unit}/photos/reorder` | Yes | auth:sanctum, active-user | `DeveloperUnitPhotoController@reorder` |
| DELETE | `/api/new-buildings/{new_building}/units/{unit}/photos/{photo}` | Yes | auth:sanctum, active-user | `DeveloperUnitPhotoController@destroy` |
| POST | `/api/new-buildings/{new_building}/units/{unit}/photos/{photo}/cover` | Yes | auth:sanctum, active-user | `DeveloperUnitPhotoController@setCover` |

## parking-types
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/parking-types` | No | - | `ParkingTypeController@index` |
| POST | `/api/parking-types` | Yes | auth:sanctum, active-user | `ParkingTypeController@store` |
| DELETE | `/api/parking-types/{parking_type}` | Yes | auth:sanctum, active-user | `ParkingTypeController@destroy` |
| GET|HEAD | `/api/parking-types/{parking_type}` | Yes | auth:sanctum, active-user | `ParkingTypeController@show` |
| PUT|PATCH | `/api/parking-types/{parking_type}` | Yes | auth:sanctum, active-user | `ParkingTypeController@update` |

## ping
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/ping` | No | - | `Closure` |

## properties
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/properties` | No | - | `PropertyController@index` |
| POST | `/api/properties` | Yes | auth:sanctum, active-user | `PropertyController@store` |
| GET|HEAD | `/api/properties/map` | No | - | `PropertyController@map` |
| DELETE | `/api/properties/{property}` | Yes | auth:sanctum, active-user | `PropertyController@destroy` |
| GET|HEAD | `/api/properties/{property}` | No | - | `PropertyController@show` |
| PUT | `/api/properties/{property}` | Yes | auth:sanctum, active-user | `PropertyController@update` |
| POST | `/api/properties/{property}/deal` | Yes | auth:sanctum, active-user | `PropertyController@saveDeal` |
| GET|HEAD | `/api/properties/{property}/logs` | Yes | auth:sanctum, active-user | `PropertyController@logs` |
| PATCH | `/api/properties/{property}/moderation-listing` | Yes | auth:sanctum, active-user | `PropertyController@updateModerationAndListingType` |
| POST | `/api/properties/{property}/photos` | Yes | auth:sanctum, active-user | `PropertyPhotoController@store` |
| PUT | `/api/properties/{property}/photos/reorder` | Yes | auth:sanctum, active-user | `PropertyPhotoController@reorder` |
| DELETE | `/api/properties/{property}/photos/{photo}` | Yes | auth:sanctum, active-user | `PropertyPhotoController@destroy` |
| POST | `/api/properties/{property}/refresh-publication` | Yes | auth:sanctum, active-user | `PropertyController@refreshPublication` |
| GET|HEAD | `/api/properties/{property}/similar` | No | - | `PropertyController@similar` |
| POST | `/api/properties/{property}/view` | No | Illuminate\Routing\Middleware\ThrottleRequests:30,1 | `PropertyController@trackView` |

## property-statuses
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/property-statuses` | No | - | `PropertyStatusController@index` |
| POST | `/api/property-statuses` | Yes | auth:sanctum, active-user | `PropertyStatusController@store` |
| DELETE | `/api/property-statuses/{property_status}` | Yes | auth:sanctum, active-user | `PropertyStatusController@destroy` |
| GET|HEAD | `/api/property-statuses/{property_status}` | Yes | auth:sanctum, active-user | `PropertyStatusController@show` |
| PUT|PATCH | `/api/property-statuses/{property_status}` | Yes | auth:sanctum, active-user | `PropertyStatusController@update` |

## property-types
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/property-types` | No | - | `PropertyTypeController@index` |
| POST | `/api/property-types` | Yes | auth:sanctum, active-user | `PropertyTypeController@store` |
| DELETE | `/api/property-types/{property_type}` | Yes | auth:sanctum, active-user | `PropertyTypeController@destroy` |
| GET|HEAD | `/api/property-types/{property_type}` | Yes | auth:sanctum, active-user | `PropertyTypeController@show` |
| PUT|PATCH | `/api/property-types/{property_type}` | Yes | auth:sanctum, active-user | `PropertyTypeController@update` |

## register
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/register` | No | - | `AuthController@register` |

## repair-types
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/repair-types` | No | - | `RepairTypeController@index` |
| POST | `/api/repair-types` | Yes | auth:sanctum, active-user | `RepairTypeController@store` |
| DELETE | `/api/repair-types/{repair_type}` | Yes | auth:sanctum, active-user | `RepairTypeController@destroy` |
| GET|HEAD | `/api/repair-types/{repair_type}` | Yes | auth:sanctum, active-user | `RepairTypeController@show` |
| PUT|PATCH | `/api/repair-types/{repair_type}` | Yes | auth:sanctum, active-user | `RepairTypeController@update` |

## reports
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/reports/agent/clients` | Yes | auth:sanctum, active-user | `PropertyReportController@agentClientsStats` |
| GET|HEAD | `/api/reports/agent/contracts` | Yes | auth:sanctum, active-user | `PropertyReportController@agentContractsStats` |
| GET|HEAD | `/api/reports/agent/earnings` | Yes | auth:sanctum, active-user | `PropertyReportController@agentEarningsReport` |
| GET|HEAD | `/api/reports/agent/shows` | Yes | auth:sanctum, active-user | `PropertyReportController@agentShowsStats` |
| GET|HEAD | `/api/reports/agents/properties` | Yes | auth:sanctum, active-user | `PropertyReportController@agentPropertiesReport` |
| GET|HEAD | `/api/reports/agents/{agent}/properties` | Yes | auth:sanctum, active-user | `PropertyReportController@agentPropertiesReport` |
| GET|HEAD | `/api/reports/missing-phone/agents-by-status` | Yes | auth:sanctum, active-user | `PropertyReportController@missingPhoneAgentsByStatus` |
| GET|HEAD | `/api/reports/missing-phone/list` | Yes | auth:sanctum, active-user | `PropertyReportController@missingPhoneList` |
| GET|HEAD | `/api/reports/properties/agents-leaderboard` | Yes | auth:sanctum, active-user | `PropertyReportController@agentsLeaderboard` |
| GET|HEAD | `/api/reports/properties/by-location` | Yes | auth:sanctum, active-user | `PropertyReportController@byLocation` |
| GET|HEAD | `/api/reports/properties/by-status` | Yes | auth:sanctum, active-user | `PropertyReportController@byStatus` |
| GET|HEAD | `/api/reports/properties/by-type` | Yes | auth:sanctum, active-user | `PropertyReportController@byType` |
| GET|HEAD | `/api/reports/properties/conversion` | Yes | auth:sanctum, active-user | `PropertyReportController@conversionFunnel` |
| GET|HEAD | `/api/reports/properties/manager-efficiency` | Yes | auth:sanctum, active-user | `PropertyReportController@managerEfficiency` |
| GET|HEAD | `/api/reports/properties/monthly-comparison` | Yes | auth:sanctum, active-user | `PropertyReportController@monthlyComparison` |
| GET|HEAD | `/api/reports/properties/monthly-comparison-range` | Yes | auth:sanctum, active-user | `PropertyReportController@monthlyComparisonRange` |
| GET|HEAD | `/api/reports/properties/price-buckets` | Yes | auth:sanctum, active-user | `PropertyReportController@priceBuckets` |
| GET|HEAD | `/api/reports/properties/rooms-hist` | Yes | auth:sanctum, active-user | `PropertyReportController@roomsHistogram` |
| GET|HEAD | `/api/reports/properties/summary` | Yes | auth:sanctum, active-user | `PropertyReportController@summary` |
| GET|HEAD | `/api/reports/properties/time-series` | Yes | auth:sanctum, active-user | `PropertyReportController@timeSeries` |

## roles
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/roles` | Yes | auth:sanctum, active-user | `RoleController@index` |
| POST | `/api/roles` | Yes | auth:sanctum, active-user | `RoleController@store` |
| DELETE | `/api/roles/{role}` | Yes | auth:sanctum, active-user | `RoleController@destroy` |
| GET|HEAD | `/api/roles/{role}` | Yes | auth:sanctum, active-user | `RoleController@show` |
| PUT|PATCH | `/api/roles/{role}` | Yes | auth:sanctum, active-user | `RoleController@update` |

## selections
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/selections` | Yes | auth:sanctum, active-user | `SelectionController@index` |
| POST | `/api/selections` | No | App\Http\Middleware\B24Jwt | `SelectionController@store` |
| GET|HEAD | `/api/selections/public/{hash}` | No | - | `SelectionController@publicShow` |
| GET|HEAD | `/api/selections/{id}` | Yes | auth:sanctum, active-user | `SelectionController@show` |
| POST | `/api/selections/{id}/events` | No | App\Http\Middleware\B24Jwt | `SelectionController@event` |

## showings
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/showings` | No | App\Http\Middleware\B24Jwt | `BookingController@store` |

## sms
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| POST | `/api/sms/request` | No | - | `AuthController@requestSmsCode` |
| POST | `/api/sms/verify` | No | - | `AuthController@verifySmsCode` |

## support-chat
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/support-chat/queue` | Yes | auth:sanctum, active-user | `SupportChatController@queue` |
| GET|HEAD | `/api/support-chat/sessions` | Yes | auth:sanctum, active-user | `SupportChatController@sessions` |
| POST | `/api/support-chat/sessions` | Yes | auth:sanctum, active-user | `SupportChatController@createSession` |
| GET|HEAD | `/api/support-chat/sessions/{session}` | Yes | auth:sanctum, active-user | `SupportChatController@showSession` |
| POST | `/api/support-chat/sessions/{session}/assign` | Yes | auth:sanctum, active-user | `SupportChatController@assign` |
| POST | `/api/support-chat/sessions/{session}/close` | Yes | auth:sanctum, active-user | `SupportChatController@close` |
| POST | `/api/support-chat/sessions/{session}/delivered` | Yes | auth:sanctum, active-user | `SupportChatController@markDelivered` |
| GET|HEAD | `/api/support-chat/sessions/{session}/messages` | Yes | auth:sanctum, active-user | `SupportChatController@messages` |
| POST | `/api/support-chat/sessions/{session}/messages` | Yes | auth:sanctum, active-user | `SupportChatController@sendMessage` |
| POST | `/api/support-chat/sessions/{session}/read` | Yes | auth:sanctum, active-user | `SupportChatController@markRead` |
| POST | `/api/support-chat/sessions/{session}/seen` | Yes | auth:sanctum, active-user | `SupportChatController@markSeen` |

## user
| Method | Endpoint | Auth | Middleware | Action |
|---|---|---|---|---|
| GET|HEAD | `/api/user` | Yes | auth:sanctum, active-user | `UserController@index` |
| POST | `/api/user` | Yes | auth:sanctum, active-user | `UserController@store` |
| GET|HEAD | `/api/user/agents` | No | - | `UserController@agents` |
| DELETE | `/api/user/photo` | Yes | auth:sanctum, active-user | `UserController@deleteMyPhoto` |
| GET|HEAD | `/api/user/profile` | Yes | auth:sanctum, active-user | `UserController@profile` |
| PUT | `/api/user/profile` | Yes | auth:sanctum, active-user | `UserController@updateProfile` |
| POST | `/api/user/update-password` | Yes | auth:sanctum, active-user | `UserController@updatePassword` |
| DELETE | `/api/user/{user}` | Yes | auth:sanctum, active-user | `UserController@destroy` |
| GET|HEAD | `/api/user/{user}` | No | - | `UserController@show` |
| PUT|PATCH | `/api/user/{user}` | Yes | auth:sanctum, active-user | `UserController@update` |
| POST | `/api/user/{user}/photo` | Yes | auth:sanctum, active-user | `UserController@updatePhoto` |
