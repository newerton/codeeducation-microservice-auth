"use strict";var module=angular.module("keycloak.loaders",["keycloak.services","ngResource"]);module.factory("Loader",(function(r){var e={get:function(e,n){return function(){var t=n&&n(),a=r.defer();return e.get(t,(function(r){a.resolve(r)}),(function(){a.reject("Unable to fetch "+t)})),a.promise}},query:function(e,n){return function(){var t=n&&n(),a=r.defer();return e.query(t,(function(r){a.resolve(r)}),(function(){a.reject("Unable to fetch "+t)})),a.promise}}};return e})),module.factory("RealmListLoader",(function(r,e,n){return r.get(e)})),module.factory("ServerInfoLoader",(function(r,e){return function(){return e.promise}})),module.factory("RealmLoader",(function(r,e,n,t){return r.get(e,(function(){return{id:n.current.params.realm}}))})),module.factory("RealmKeysLoader",(function(r,e,n,t){return r.get(e,(function(){return{id:n.current.params.realm}}))})),module.factory("RealmSpecificLocalesLoader",(function(r,e,n,t){return r.get(e,(function(){return{id:n.current.params.realm}}))})),module.factory("RealmSpecificlocalizationTextLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,locale:n.current.params.locale,key:n.current.params.key}}))})),module.factory("RealmEventsConfigLoader",(function(r,e,n,t){return r.get(e,(function(){return{id:n.current.params.realm}}))})),module.factory("UserListLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("RequiredActionsListLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("UnregisteredRequiredActionsListLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("RealmSessionStatsLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("RealmClientSessionStatsLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("ClientProtocolMapperLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client,id:n.current.params.id}}))})),module.factory("ClientScopeProtocolMapperLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,clientScope:n.current.params.clientScope,id:n.current.params.id}}))})),module.factory("UserLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,userId:n.current.params.user}}))})),module.factory("ComponentLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,componentId:n.current.params.componentId}}))})),module.factory("LDAPMapperLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,componentId:n.current.params.mapperId}}))})),module.factory("ComponentsLoader",(function(r,e,n,t){var a={loadComponents:function(t,a){return r.query(e,(function(){return{realm:n.current.params.realm,parent:t,type:a}}))()}};return a})),module.factory("SubComponentTypesLoader",(function(r,e,n,t){var a={loadComponents:function(t,a){return r.query(e,(function(){return{realm:n.current.params.realm,componentId:t,type:a}}))()}};return a})),module.factory("UserSessionStatsLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,user:n.current.params.user}}))})),module.factory("UserSessionsLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,user:n.current.params.user}}))})),module.factory("UserOfflineSessionsLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,user:n.current.params.user,client:n.current.params.client}}))})),module.factory("UserFederatedIdentityLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,user:n.current.params.user}}))})),module.factory("UserConsentsLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,user:n.current.params.user}}))})),module.factory("RoleLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,role:n.current.params.role}}))})),module.factory("RoleListLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("ClientRoleLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client,role:n.current.params.role}}))})),module.factory("ClientSessionStatsLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client}}))})),module.factory("ClientSessionCountLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client}}))})),module.factory("ClientOfflineSessionCountLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client}}))})),module.factory("ClientDefaultClientScopesLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client}}))})),module.factory("ClientOptionalClientScopesLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client}}))})),module.factory("ClientLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client}}))})),module.factory("ClientListLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,first:0,max:20}}))})),module.factory("ClientScopeLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,clientScope:n.current.params.clientScope}}))})),module.factory("ClientScopeListLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("RealmDefaultClientScopesLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("RealmOptionalClientScopesLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("ClientServiceAccountUserLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,client:n.current.params.client}}))})),module.factory("RoleMappingLoader",(function(r,e,n,t){var a=n.current.params.realm||n.current.params.client;return r.query(e,(function(){return{realm:a,role:n.current.params.role}}))})),module.factory("IdentityProviderLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,alias:n.current.params.alias}}))})),module.factory("IdentityProviderFactoryLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,provider_id:n.current.params.provider_id}}))})),module.factory("IdentityProviderMapperTypesLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,alias:n.current.params.alias}}))})),module.factory("IdentityProviderMappersLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,alias:n.current.params.alias}}))})),module.factory("IdentityProviderMapperLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,alias:n.current.params.alias,mapperId:n.current.params.mapperId}}))})),module.factory("AuthenticationFlowsLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,flow:""}}))})),module.factory("AuthenticationFormProvidersLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("AuthenticationFormActionProvidersLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("AuthenticatorProvidersLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("ClientAuthenticatorProvidersLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("AuthenticationFlowLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,flow:n.current.params.flow}}))})),module.factory("AuthenticationConfigDescriptionLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,provider:n.current.params.provider}}))})),module.factory("PerClientAuthenticationConfigDescriptionLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("ExecutionIdLoader",(function(r){return function(){return r.current.params.executionId}})),module.factory("AuthenticationConfigLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,config:n.current.params.config}}))})),module.factory("GroupListLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("GroupCountLoader",(function(r,e,n,t){return r.query(e,(function(){return{realm:n.current.params.realm,top:!0}}))})),module.factory("GroupLoader",(function(r,e,n,t){return r.get(e,(function(){return{realm:n.current.params.realm,groupId:n.current.params.group}}))})),module.factory("ClientInitialAccessLoader",(function(r,e,n){return r.query(e,(function(){return{realm:n.current.params.realm}}))})),module.factory("ClientRegistrationPolicyProvidersLoader",(function(r,e,n){return r.query(e,(function(){return{realm:n.current.params.realm}}))}));