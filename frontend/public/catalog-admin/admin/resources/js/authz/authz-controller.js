module.controller('ResourceServerCtrl', ($scope, realm, ResourceServer) => {
  $scope.realm = realm;

  ResourceServer.query({ realm: realm.realm }, (data) => {
    $scope.servers = data;
  });
});

module.controller(
  'ResourceServerDetailCtrl',
  (
    $scope,
    _$http,
    $route,
    _$location,
    _$upload,
    $modal,
    realm,
    ResourceServer,
    client,
    _AuthzDialog,
    Notifications,
  ) => {
    $scope.realm = realm;
    $scope.client = client;

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = angular.copy(data);
        $scope.changed = false;

        $scope.$watch(
          'server',
          () => {
            if (!angular.equals($scope.server, data)) {
              $scope.changed = true;
            }
          },
          true,
        );

        $scope.save = () => {
          ResourceServer.update(
            { realm: realm.realm, client: $scope.server.clientId },
            $scope.server,
            () => {
              $route.reload();
              Notifications.success('The resource server has been created.');
            },
          );
        };

        $scope.reset = () => {
          $route.reload();
        };

        $scope.export = () => {
          $scope.exportSettings = true;
          ResourceServer.settings(
            {
              realm: $route.current.params.realm,
              client: client.id,
            },
            (data) => {
              var tmp = angular.fromJson(data);
              $scope.settings = angular.toJson(tmp, true);
            },
          );
        };

        $scope.downloadSettings = () => {
          saveAs(
            new Blob([$scope.settings], { type: 'application/json' }),
            `${$scope.server.name}-authz-config.json`,
          );
        };

        $scope.cancelExport = () => {
          delete $scope.settings;
        };

        $scope.onFileSelect = ($fileContent) => {
          $scope.server = angular.copy(JSON.parse($fileContent));
          $scope.importing = true;
        };

        $scope.viewImportDetails = () => {
          $modal.open({
            templateUrl: `${resourceUrl}/partials/modal/view-object.html`,
            controller: 'ObjectModalCtrl',
            resolve: {
              object: () => $scope.server,
            },
          });
        };

        $scope.import = () => {
          ResourceServer.import(
            { realm: realm.realm, client: client.id },
            $scope.server,
            () => {
              $route.reload();
              Notifications.success('The resource server has been updated.');
            },
          );
        };
      },
    );
  },
);

var Resources = {
  delete: (
    ResourceServerResource,
    realm,
    client,
    $scope,
    AuthzDialog,
    $location,
    Notifications,
    $route,
  ) => {
    ResourceServerResource.permissions(
      {
        realm: realm,
        client: client.id,
        rsrid: $scope.resource._id,
      },
      (permissions) => {
        var msg = '';

        if (permissions.length > 0 && !$scope.deleteConsent) {
          msg = '<p>This resource is referenced in some permissions:</p>';
          msg += '<ul>';
          for (i = 0; i < permissions.length; i++) {
            msg += `<li><strong>${permissions[i].name}</strong></li>`;
          }
          msg += '</ul>';
          msg +=
            '<p>If you remove this resource, the permissions above will be affected and will not be associated with this resource anymore.</p>';
        }

        AuthzDialog.confirmDeleteWithMsg(
          $scope.resource.name,
          'Resource',
          msg,
          () => {
            ResourceServerResource.delete(
              {
                realm: realm,
                client: $scope.client.id,
                rsrid: $scope.resource._id,
              },
              null,
              () => {
                $location.url(
                  `/realms/${realm}/clients/${$scope.client.id}/authz/resource-server/resource`,
                );
                $route.reload();
                Notifications.success('The resource has been deleted.');
              },
            );
          },
        );
      },
    );
  },
};

var Policies = {
  delete: (
    service,
    realm,
    client,
    $scope,
    AuthzDialog,
    $location,
    Notifications,
    $route,
    isPermission,
  ) => {
    var msg = '';

    service.dependentPolicies(
      {
        realm: realm,
        client: client.id,
        id: $scope.policy.id,
      },
      (dependentPolicies) => {
        if (dependentPolicies.length > 0 && !$scope.deleteConsent) {
          msg = '<p>This policy is being used by other policies:</p>';
          msg += '<ul>';
          for (i = 0; i < dependentPolicies.length; i++) {
            msg += `<li><strong>${dependentPolicies[i].name}</strong></li>`;
          }
          msg += '</ul>';
          msg +=
            '<p>If you remove this policy, the policies above will be affected and will not be associated with this policy anymore.</p>';
        }

        AuthzDialog.confirmDeleteWithMsg(
          $scope.policy.name,
          isPermission ? 'Permission' : 'Policy',
          msg,
          () => {
            service.delete(
              { realm: realm, client: $scope.client.id, id: $scope.policy.id },
              null,
              () => {
                if (isPermission) {
                  $location.url(
                    `/realms/${realm}/clients/${$scope.client.id}/authz/resource-server/permission`,
                  );
                  Notifications.success('The permission has been deleted.');
                } else {
                  $location.url(
                    `/realms/${realm}/clients/${$scope.client.id}/authz/resource-server/policy`,
                  );
                  Notifications.success('The policy has been deleted.');
                }
                $route.reload();
              },
            );
          },
        );
      },
    );
  },
};

module.controller(
  'ResourceServerResourceCtrl',
  (
    $scope,
    _$http,
    $route,
    $location,
    realm,
    ResourceServer,
    ResourceServerResource,
    client,
    AuthzDialog,
    Notifications,
    viewState,
  ) => {
    $scope.realm = realm;
    $scope.client = client;

    $scope.query = {
      realm: realm.realm,
      client: client.id,
      deep: false,
      max: 20,
      first: 0,
    };

    $scope.listSizes = [5, 10, 20];

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = data;

        $scope.createPolicy = (resource) => {
          viewState.state = {};
          viewState.state.previousUrl = `/realms/${$route.current.params.realm}/clients/${client.id}/authz/resource-server/resource`;
          $location
            .path(
              `/realms/${$route.current.params.realm}/clients/${client.id}/authz/resource-server/permission/resource/create`,
            )
            .search({ rsrid: resource._id });
        };

        $scope.searchQuery();
      },
    );

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.searchQuery();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.searchQuery();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.searchQuery();
    };

    $scope.searchQuery = () => {
      $scope.searchLoaded = false;

      ResourceServerResource.query($scope.query, (response) => {
        $scope.searchLoaded = true;
        $scope.lastSearch = $scope.query.search;
        $scope.resources = response;
        if ($scope.detailsFilter) {
          $scope.showDetails();
        }
      });
    };

    $scope.loadDetails = (resource) => {
      if (resource.details) {
        resource.details.loaded = !resource.details.loaded;
        return;
      }

      resource.details = { loaded: false };

      ResourceServerResource.scopes(
        {
          realm: $route.current.params.realm,
          client: client.id,
          rsrid: resource._id,
        },
        (response) => {
          resource.scopes = response;
          ResourceServerResource.permissions(
            {
              realm: $route.current.params.realm,
              client: client.id,
              rsrid: resource._id,
            },
            (response) => {
              resource.policies = response;
              resource.details.loaded = true;
            },
          );
        },
      );
    };

    $scope.showDetails = (item, event) => {
      if (
        event.target.localName === 'a' ||
        event.target.localName === 'button'
      ) {
        return;
      }

      if (item) {
        $scope.loadDetails(item);
      } else {
        for (i = 0; i < $scope.resources.length; i++) {
          $scope.loadDetails($scope.resources[i]);
        }
      }
    };

    $scope.delete = (resource) => {
      $scope.resource = resource;
      Resources.delete(
        ResourceServerResource,
        $route.current.params.realm,
        client,
        $scope,
        AuthzDialog,
        $location,
        Notifications,
        $route,
      );
    };
  },
);

module.controller(
  'ResourceServerResourceDetailCtrl',
  function (
    $scope,
    _$http,
    $route,
    $location,
    realm,
    ResourceServer,
    client,
    ResourceServerResource,
    ResourceServerScope,
    AuthzDialog,
    Notifications,
  ) {
    $scope.realm = realm;
    $scope.client = client;

    $scope.scopesUiSelect = {
      minimumInputLength: 1,
      delay: 500,
      allowClear: true,
      query: (query) => {
        var data = { results: [] };
        if ('' === query.term.trim()) {
          query.callback(data);
          return;
        }
        $scope.query = {
          realm: realm.realm,
          client: client.id,
          name: query.term.trim(),
          deep: false,
          max: 20,
          first: 0,
        };
        ResourceServerScope.query($scope.query, (response) => {
          data.results = response;
          query.callback(data);
        });
      },
      formatResult: (object, _container, _query) => object.name,
      formatSelection: (object, _container, _query) => object.name,
    };

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = data;

        var resourceId = $route.current.params.rsrid;

        if (!resourceId) {
          $scope.create = true;
          $scope.changed = false;

          var resource = {};
          resource.scopes = [];
          resource.attributes = {};
          resource.uris = [];

          $scope.resource = angular.copy(resource);

          $scope.$watch(
            'resource',
            () => {
              if (!angular.equals($scope.resource, resource)) {
                $scope.changed = true;
              }
            },
            true,
          );

          $scope.$watch(
            'newUri',
            () => {
              if ($scope.newUri && $scope.newUri.length > 0) {
                $scope.changed = true;
              }
            },
            true,
          );

          $scope.save = () => {
            if ($scope.newUri && $scope.newUri.length > 0) {
              $scope.addUri();
            }

            for (i = 0; i < $scope.resource.scopes.length; i++) {
              delete $scope.resource.scopes[i].text;
            }
            this.checkNameAvailability(() => {
              ResourceServerResource.save(
                { realm: realm.realm, client: $scope.client.id },
                $scope.resource,
                (data) => {
                  $location.url(
                    `/realms/${realm.realm}/clients/${$scope.client.id}/authz/resource-server/resource/${data._id}`,
                  );
                  Notifications.success('The resource has been created.');
                },
              );
            });
          };

          $scope.reset = () => {
            $location.url(
              `/realms/${realm.realm}/clients/${$scope.client.id}/authz/resource-server/resource/`,
            );
          };
        } else {
          ResourceServerResource.get(
            {
              realm: $route.current.params.realm,
              client: client.id,
              rsrid: $route.current.params.rsrid,
            },
            (data) => {
              if (!data.scopes) {
                data.scopes = [];
              }

              if (!data.attributes) {
                data.attributes = {};
              }

              $scope.resource = angular.copy(data);
              $scope.changed = false;

              $scope.originalResource = angular.copy($scope.resource);

              $scope.$watch(
                'resource',
                () => {
                  if (!angular.equals($scope.resource, data)) {
                    $scope.changed = true;
                  }
                },
                true,
              );

              $scope.$watch(
                'newUri',
                () => {
                  if ($scope.newUri && $scope.newUri.length > 0) {
                    $scope.changed = true;
                  }
                },
                true,
              );

              $scope.save = () => {
                if ($scope.newUri && $scope.newUri.length > 0) {
                  $scope.addUri();
                }

                for (i = 0; i < $scope.resource.scopes.length; i++) {
                  delete $scope.resource.scopes[i].text;
                }

                var keys = Object.keys($scope.resource.attributes);

                for (var k = 0; k < keys.length; k++) {
                  var key = keys[k];
                  var value = $scope.resource.attributes[key];
                  var values = value.toString().split(',');

                  $scope.resource.attributes[key] = [];

                  for (j = 0; j < values.length; j++) {
                    $scope.resource.attributes[key].push(values[j]);
                  }
                }
                this.checkNameAvailability(() => {
                  ResourceServerResource.update(
                    {
                      realm: realm.realm,
                      client: $scope.client.id,
                      rsrid: $scope.resource._id,
                    },
                    $scope.resource,
                    () => {
                      $route.reload();
                      Notifications.success('The resource has been updated.');
                    },
                  );
                });
              };

              $scope.remove = () => {
                Resources.delete(
                  ResourceServerResource,
                  $route.current.params.realm,
                  client,
                  $scope,
                  AuthzDialog,
                  $location,
                  Notifications,
                  $route,
                );
              };

              $scope.reset = () => {
                $route.reload();
              };
            },
          );
        }
      },
    );

    $scope.checkNewNameAvailability = () => {
      this.checkNameAvailability(() => {});
    };

    this.checkNameAvailability = (onSuccess) => {
      if (!$scope.resource.name || $scope.resource.name.trim().length === 0) {
        return;
      }
      ResourceServerResource.search(
        {
          realm: $route.current.params.realm,
          client: client.id,
          rsrid: $route.current.params.rsrid,
          name: $scope.resource.name,
        },
        (data) => {
          if (data?._id && data._id !== $scope.resource._id) {
            Notifications.error(
              'Name already in use by another resource, please choose another one.',
            );
          } else {
            onSuccess();
          }
        },
      );
    };

    $scope.addAttribute = () => {
      $scope.resource.attributes[$scope.newAttribute.key] =
        $scope.newAttribute.value;
      delete $scope.newAttribute;
    };

    $scope.removeAttribute = (key) => {
      delete $scope.resource.attributes[key];
    };

    $scope.addUri = () => {
      $scope.resource.uris.push($scope.newUri);
      $scope.newUri = '';
    };

    $scope.deleteUri = (index) => {
      $scope.resource.uris.splice(index, 1);
    };
  },
);

var Scopes = {
  delete: (
    ResourceServerScope,
    realm,
    client,
    $scope,
    AuthzDialog,
    $location,
    Notifications,
    $route,
  ) => {
    ResourceServerScope.permissions(
      {
        realm: realm,
        client: client.id,
        id: $scope.scope.id,
      },
      (permissions) => {
        var msg = '';

        if (permissions.length > 0 && !$scope.deleteConsent) {
          msg = '<p>This scope is referenced in some permissions:</p>';
          msg += '<ul>';
          for (i = 0; i < permissions.length; i++) {
            msg += `<li><strong>${permissions[i].name}</strong></li>`;
          }
          msg += '</ul>';
          msg +=
            '<p>If you remove this scope, the permissions above will be affected and will not be associated with this scope anymore.</p>';
        }

        AuthzDialog.confirmDeleteWithMsg(
          $scope.scope.name,
          'Scope',
          msg,
          () => {
            ResourceServerScope.delete(
              { realm: realm, client: $scope.client.id, id: $scope.scope.id },
              null,
              () => {
                $location.url(
                  `/realms/${realm}/clients/${$scope.client.id}/authz/resource-server/scope`,
                );
                $route.reload();
                Notifications.success('The scope has been deleted.');
              },
            );
          },
        );
      },
    );
  },
};

module.controller(
  'ResourceServerScopeCtrl',
  (
    $scope,
    _$http,
    $route,
    $location,
    realm,
    ResourceServer,
    ResourceServerScope,
    client,
    AuthzDialog,
    Notifications,
    viewState,
  ) => {
    $scope.realm = realm;
    $scope.client = client;

    $scope.query = {
      realm: realm.realm,
      client: client.id,
      deep: false,
      max: 20,
      first: 0,
    };

    $scope.listSizes = [5, 10, 20];

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = data;

        $scope.createPolicy = (scope) => {
          viewState.state = {};
          viewState.state.previousUrl = `/realms/${$route.current.params.realm}/clients/${client.id}/authz/resource-server/scope`;
          $location
            .path(
              `/realms/${$route.current.params.realm}/clients/${client.id}/authz/resource-server/permission/scope/create`,
            )
            .search({ scpid: scope.id });
        };

        $scope.searchQuery();
      },
    );

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.searchQuery();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.searchQuery();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.searchQuery();
    };

    $scope.searchQuery = (_detailsFilter) => {
      $scope.searchLoaded = false;

      ResourceServerScope.query($scope.query, (response) => {
        $scope.scopes = response;
        $scope.searchLoaded = true;
        $scope.lastSearch = $scope.query.search;
        if ($scope.detailsFilter) {
          $scope.showDetails();
        }
      });
    };

    $scope.loadDetails = (scope) => {
      if (scope.details) {
        scope.details.loaded = !scope.details.loaded;
        return;
      }

      scope.details = { loaded: false };

      ResourceServerScope.resources(
        {
          realm: $route.current.params.realm,
          client: client.id,
          id: scope.id,
        },
        (response) => {
          scope.resources = response;
          ResourceServerScope.permissions(
            {
              realm: $route.current.params.realm,
              client: client.id,
              id: scope.id,
            },
            (response) => {
              scope.policies = response;
              scope.details.loaded = true;
            },
          );
        },
      );
    };

    $scope.showDetails = (item, event) => {
      if (
        event.target.localName === 'a' ||
        event.target.localName === 'button'
      ) {
        return;
      }
      if (item) {
        $scope.loadDetails(item);
      } else {
        for (i = 0; i < $scope.scopes.length; i++) {
          $scope.loadDetails($scope.scopes[i]);
        }
      }
    };

    $scope.delete = (scope) => {
      $scope.scope = scope;
      Scopes.delete(
        ResourceServerScope,
        $route.current.params.realm,
        client,
        $scope,
        AuthzDialog,
        $location,
        Notifications,
        $route,
      );
    };
  },
);

module.controller(
  'ResourceServerScopeDetailCtrl',
  function (
    $scope,
    _$http,
    $route,
    $location,
    realm,
    ResourceServer,
    client,
    ResourceServerScope,
    AuthzDialog,
    Notifications,
  ) {
    $scope.realm = realm;
    $scope.client = client;

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = data;

        var scopeId = $route.current.params.id;

        if (!scopeId) {
          $scope.create = true;
          $scope.changed = false;

          var scope = {};

          $scope.scope = angular.copy(scope);

          $scope.$watch(
            'scope',
            () => {
              if (!angular.equals($scope.scope, scope)) {
                $scope.changed = true;
              }
            },
            true,
          );

          $scope.save = () => {
            this.checkNameAvailability(() => {
              ResourceServerScope.save(
                { realm: realm.realm, client: $scope.client.id },
                $scope.scope,
                (data) => {
                  $location.url(
                    `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/scope/${data.id}`,
                  );
                  Notifications.success('The scope has been created.');
                },
              );
            });
          };

          $scope.reset = () => {
            $location.url(
              `/realms/${realm.realm}/clients/${$scope.client.id}/authz/resource-server/scope/`,
            );
          };
        } else {
          ResourceServerScope.get(
            {
              realm: $route.current.params.realm,
              client: client.id,
              id: $route.current.params.id,
            },
            (data) => {
              $scope.scope = angular.copy(data);
              $scope.changed = false;

              $scope.$watch(
                'scope',
                () => {
                  if (!angular.equals($scope.scope, data)) {
                    $scope.changed = true;
                  }
                },
                true,
              );

              $scope.originalScope = angular.copy($scope.scope);

              $scope.save = () => {
                this.checkNameAvailability(() => {
                  ResourceServerScope.update(
                    {
                      realm: realm.realm,
                      client: $scope.client.id,
                      id: $scope.scope.id,
                    },
                    $scope.scope,
                    () => {
                      $scope.changed = false;
                      Notifications.success('The scope has been updated.');
                    },
                  );
                });
              };

              $scope.remove = () => {
                Scopes.delete(
                  ResourceServerScope,
                  $route.current.params.realm,
                  client,
                  $scope,
                  AuthzDialog,
                  $location,
                  Notifications,
                  $route,
                );
              };

              $scope.reset = () => {
                $route.reload();
              };
            },
          );
        }
      },
    );

    $scope.checkNewNameAvailability = () => {
      this.checkNameAvailability(() => {});
    };

    this.checkNameAvailability = (onSuccess) => {
      if (!$scope.scope.name || $scope.scope.name.trim().length === 0) {
        return;
      }
      ResourceServerScope.search(
        {
          realm: $route.current.params.realm,
          client: client.id,
          name: $scope.scope.name,
        },
        (data) => {
          if (data?.id && data.id !== $scope.scope.id) {
            Notifications.error(
              'Name already in use by another scope, please choose another one.',
            );
          } else {
            onSuccess();
          }
        },
      );
    };
  },
);

module.controller(
  'ResourceServerPolicyCtrl',
  (
    $scope,
    _$http,
    $route,
    $location,
    realm,
    ResourceServer,
    ResourceServerPolicy,
    PolicyProvider,
    client,
    AuthzDialog,
    Notifications,
    KcStrings,
  ) => {
    $scope.realm = realm;
    $scope.client = client;
    $scope.policyProviders = [];

    $scope.query = {
      realm: realm.realm,
      client: client.id,
      permission: false,
      max: 20,
      first: 0,
    };

    $scope.listSizes = [5, 10, 20];

    PolicyProvider.query(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        for (i = 0; i < data.length; i++) {
          if (data[i].type !== 'resource' && data[i].type !== 'scope') {
            $scope.policyProviders.push(data[i]);
          }
        }
      },
    );

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = data;
        $scope.searchQuery();
      },
    );

    $scope.addPolicy = (policyType) => {
      if (KcStrings.endsWith(policyType.type, '.js')) {
        ResourceServerPolicy.save(
          { realm: realm.realm, client: client.id, type: policyType.type },
          { name: policyType.name, type: policyType.type },
          (_data) => {
            $location.url(
              `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/policy/`,
            );
            Notifications.success('The policy has been created.');
          },
        );
      } else {
        $location.url(
          `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/policy/${policyType.type}/create`,
        );
      }
    };

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.searchQuery();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.searchQuery();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.searchQuery();
    };

    $scope.searchQuery = () => {
      $scope.searchLoaded = false;

      ResourceServerPolicy.query($scope.query, (data) => {
        $scope.policies = data;
        $scope.searchLoaded = true;
        $scope.lastSearch = $scope.query.search;
        if ($scope.detailsFilter) {
          $scope.showDetails();
        }
      });
    };

    $scope.loadDetails = (policy) => {
      if (policy.details) {
        policy.details.loaded = !policy.details.loaded;
        return;
      }

      policy.details = { loaded: false };

      ResourceServerPolicy.dependentPolicies(
        {
          realm: $route.current.params.realm,
          client: client.id,
          id: policy.id,
        },
        (response) => {
          policy.dependentPolicies = response;
          policy.details.loaded = true;
        },
      );
    };

    $scope.showDetails = (item, event) => {
      if (
        event.target.localName === 'a' ||
        event.target.localName === 'button'
      ) {
        return;
      }
      if (item) {
        $scope.loadDetails(item);
      } else {
        for (i = 0; i < $scope.policies.length; i++) {
          $scope.loadDetails($scope.policies[i]);
        }
      }
    };

    $scope.delete = (policy) => {
      $scope.policy = policy;
      Policies.delete(
        ResourceServerPolicy,
        $route.current.params.realm,
        client,
        $scope,
        AuthzDialog,
        $location,
        Notifications,
        $route,
        false,
      );
    };
  },
);

module.controller(
  'ResourceServerPermissionCtrl',
  (
    $scope,
    _$http,
    $route,
    $location,
    realm,
    ResourceServer,
    ResourceServerPermission,
    PolicyProvider,
    client,
    AuthzDialog,
    Notifications,
  ) => {
    $scope.realm = realm;
    $scope.client = client;
    $scope.policyProviders = [];

    $scope.query = {
      realm: realm.realm,
      client: client.id,
      max: 20,
      first: 0,
    };

    $scope.listSizes = [5, 10, 20];

    PolicyProvider.query(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        for (i = 0; i < data.length; i++) {
          if (data[i].type === 'resource' || data[i].type === 'scope') {
            $scope.policyProviders.push(data[i]);
          }
        }
      },
    );

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = data;
        $scope.searchQuery();
      },
    );

    $scope.addPolicy = (policyType) => {
      $location.url(
        `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/permission/${policyType.type}/create`,
      );
    };

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.searchQuery();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.searchQuery();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.searchQuery();
    };

    $scope.searchQuery = () => {
      $scope.searchLoaded = false;

      ResourceServerPermission.query($scope.query, (data) => {
        $scope.policies = data;
        $scope.searchLoaded = true;
        $scope.lastSearch = $scope.query.search;
        if ($scope.detailsFilter) {
          $scope.showDetails();
        }
      });
    };

    $scope.loadDetails = (policy) => {
      if (policy.details) {
        policy.details.loaded = !policy.details.loaded;
        return;
      }

      policy.details = { loaded: false };

      ResourceServerPermission.associatedPolicies(
        {
          realm: $route.current.params.realm,
          client: client.id,
          id: policy.id,
        },
        (response) => {
          policy.associatedPolicies = response;
          policy.details.loaded = true;
        },
      );
    };

    $scope.showDetails = (item, event) => {
      if (
        event.target.localName === 'a' ||
        event.target.localName === 'button'
      ) {
        return;
      }
      if (item) {
        $scope.loadDetails(item);
      } else {
        for (i = 0; i < $scope.policies.length; i++) {
          $scope.loadDetails($scope.policies[i]);
        }
      }
    };

    $scope.delete = (policy) => {
      $scope.policy = policy;
      Policies.delete(
        ResourceServerPermission,
        $route.current.params.realm,
        client,
        $scope,
        AuthzDialog,
        $location,
        Notifications,
        $route,
        true,
      );
    };
  },
);

module.controller(
  'ResourceServerPolicyResourceDetailCtrl',
  (
    $scope,
    $route,
    $location,
    realm,
    client,
    PolicyController,
    ResourceServerPermission,
    ResourceServerResource,
    policyViewState,
  ) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'resource',

        isPermission: () => true,

        onInit: () => {
          $scope.resourcesUiSelect = {
            minimumInputLength: 1,
            delay: 500,
            allowClear: true,
            id: (resource) => resource._id,
            query: (query) => {
              var data = { results: [] };
              if ('' === query.term.trim()) {
                query.callback(data);
                return;
              }
              $scope.query = {
                realm: realm.realm,
                client: client.id,
                name: query.term.trim(),
                deep: false,
                max: 20,
                first: 0,
              };
              ResourceServerResource.query($scope.query, (response) => {
                data.results = response;
                query.callback(data);
              });
            },
            formatResult: (object, _container, _query) => {
              object.text = object.name;
              return object.name;
            },
          };

          $scope.policiesUiSelect = {
            minimumInputLength: 1,
            delay: 500,
            allowClear: true,
            query: (query) => {
              var data = { results: [] };
              if ('' === query.term.trim()) {
                query.callback(data);
                return;
              }
              $scope.query = {
                realm: realm.realm,
                client: client.id,
                permission: false,
                name: query.term.trim(),
                max: 20,
                first: 0,
              };
              ResourceServerPermission.searchPolicies(
                $scope.query,
                (response) => {
                  data.results = response;
                  query.callback(data);
                },
              );
            },
            formatResult: (object, _container, _query) => {
              object.text = object.name;
              return object.name;
            },
          };

          $scope.applyToResourceType = () => {
            if ($scope.applyToResourceTypeFlag) {
              $scope.selectedResource = null;
            } else {
              $scope.policy.resourceType = null;
            }
          };
        },

        onInitUpdate: (policy) => {
          if (!policy.resourceType) {
            $scope.selectedResource = {};
            ResourceServerPermission.resources(
              {
                realm: $route.current.params.realm,
                client: client.id,
                id: policy.id,
              },
              (resources) => {
                resources[0].text = resources[0].name;
                $scope.selectedResource = resources[0];
                var copy = angular.copy($scope.selectedResource);
                $scope.$watch(
                  'selectedResource',
                  () => {
                    if (!angular.equals($scope.selectedResource, copy)) {
                      $scope.changed = true;
                    }
                  },
                  true,
                );
              },
            );
          } else {
            $scope.applyToResourceTypeFlag = true;
          }

          ResourceServerPermission.associatedPolicies(
            {
              realm: $route.current.params.realm,
              client: client.id,
              id: policy.id,
            },
            (policies) => {
              $scope.selectedPolicies = [];
              for (i = 0; i < policies.length; i++) {
                policies[i].text = policies[i].name;
                $scope.selectedPolicies.push(policies[i]);
              }
              var copy = angular.copy($scope.selectedPolicies);
              $scope.$watch(
                'selectedPolicies',
                () => {
                  if (!angular.equals($scope.selectedPolicies, copy)) {
                    $scope.changed = true;
                  }
                },
                true,
              );
            },
          );
        },

        onUpdate: () => {
          if ($scope.selectedResource?._id) {
            $scope.policy.resources = [];
            $scope.policy.resources.push($scope.selectedResource._id);
          } else {
            $scope.policy.resources = [];
          }

          var policies = [];

          for (i = 0; i < $scope.selectedPolicies.length; i++) {
            policies.push($scope.selectedPolicies[i].id);
          }

          $scope.policy.policies = policies;
          delete $scope.policy.config;
        },

        onInitCreate: (_newPolicy) => {
          policyViewState.state.previousPage.name =
            'authz-add-resource-permission';
          $scope.selectedResource = null;
          var copy = angular.copy($scope.selectedResource);
          $scope.$watch(
            'selectedResource',
            () => {
              if (!angular.equals($scope.selectedResource, copy)) {
                $scope.changed = true;
              }
            },
            true,
          );

          $scope.selectedPolicies = null;
          var copy = angular.copy($scope.selectedPolicies);
          $scope.$watch(
            'selectedPolicies',
            () => {
              if (!angular.equals($scope.selectedPolicies, copy)) {
                $scope.changed = true;
              }
            },
            true,
          );

          var resourceId = $location.search()['rsrid'];

          if (resourceId) {
            ResourceServerResource.get(
              {
                realm: $route.current.params.realm,
                client: client.id,
                rsrid: resourceId,
              },
              (data) => {
                data.text = data.name;
                $scope.selectedResource = data;
              },
            );
          }
        },

        onCreate: () => {
          if ($scope.selectedResource?._id) {
            $scope.policy.resources = [];
            $scope.policy.resources.push($scope.selectedResource._id);
          } else {
            delete $scope.policy.resources;
          }

          var policies = [];

          if ($scope.selectedPolicies) {
            for (i = 0; i < $scope.selectedPolicies.length; i++) {
              policies.push($scope.selectedPolicies[i].id);
            }
          }

          $scope.policy.policies = policies;
          delete $scope.policy.config;
        },

        onSaveState: (_policy) => {
          policyViewState.state.selectedResource = $scope.selectedResource;
          policyViewState.state.applyToResourceTypeFlag =
            $scope.applyToResourceTypeFlag;
        },

        onRestoreState: (policy) => {
          $scope.selectedResource = policyViewState.state.selectedResource;
          $scope.applyToResourceTypeFlag =
            policyViewState.state.applyToResourceTypeFlag;
          policy.resourceType = policyViewState.state.policy.resourceType;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.controller(
  'ResourceServerPolicyScopeDetailCtrl',
  (
    $scope,
    $route,
    $location,
    realm,
    client,
    PolicyController,
    ResourceServerPolicy,
    ResourceServerResource,
    ResourceServerScope,
    policyViewState,
  ) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'scope',

        isPermission: () => true,

        onInit: () => {
          $scope.scopesUiSelect = {
            minimumInputLength: 1,
            delay: 500,
            allowClear: true,
            query: (query) => {
              var data = { results: [] };
              if ('' === query.term.trim()) {
                query.callback(data);
                return;
              }
              $scope.query = {
                realm: realm.realm,
                client: client.id,
                name: query.term.trim(),
                deep: false,
                max: 20,
                first: 0,
              };
              ResourceServerScope.query($scope.query, (response) => {
                data.results = response;
                query.callback(data);
              });
            },
            formatResult: (object, _container, _query) => {
              object.text = object.name;
              return object.name;
            },
          };

          $scope.resourcesUiSelect = {
            minimumInputLength: 1,
            delay: 500,
            allowClear: true,
            id: (resource) => resource._id,
            query: (query) => {
              var data = { results: [] };
              if ('' === query.term.trim()) {
                query.callback(data);
                return;
              }
              $scope.query = {
                realm: realm.realm,
                client: client.id,
                name: query.term.trim(),
                deep: false,
                max: 20,
                first: 0,
              };
              ResourceServerResource.query($scope.query, (response) => {
                data.results = response;
                query.callback(data);
              });
            },
            formatResult: (object, _container, _query) => {
              object.text = object.name;
              return object.name;
            },
          };

          $scope.policiesUiSelect = {
            minimumInputLength: 1,
            delay: 500,
            allowClear: true,
            query: (query) => {
              var data = { results: [] };
              if ('' === query.term.trim()) {
                query.callback(data);
                return;
              }
              $scope.query = {
                realm: realm.realm,
                client: client.id,
                permission: false,
                name: query.term.trim(),
                max: 20,
                first: 0,
              };
              ResourceServerPolicy.query($scope.query, (response) => {
                data.results = response;
                query.callback(data);
              });
            },
            formatResult: (object, _container, _query) => {
              object.text = object.name;
              return object.name;
            },
          };

          $scope.selectResource = () => {
            $scope.selectedScopes = null;
            if ($scope.selectedResource) {
              ResourceServerResource.scopes(
                {
                  realm: $route.current.params.realm,
                  client: client.id,
                  rsrid: $scope.selectedResource._id,
                },
                (data) => {
                  $scope.resourceScopes = data;
                },
              );
            }
          };
        },

        onInitUpdate: (policy) => {
          ResourceServerPolicy.resources(
            {
              realm: $route.current.params.realm,
              client: client.id,
              id: policy.id,
            },
            (resources) => {
              if (resources.length > 0) {
                for (i = 0; i < resources.length; i++) {
                  ResourceServerResource.get(
                    {
                      realm: $route.current.params.realm,
                      client: client.id,
                      rsrid: resources[0]._id,
                    },
                    (resource) => {
                      ResourceServerResource.query(
                        {
                          realm: $route.current.params.realm,
                          client: client.id,
                          _id: resource._id,
                          deep: false,
                        },
                        (resource) => {
                          resource[0].text = resource[0].name;
                          $scope.selectedResource = resource[0];
                          var copy = angular.copy($scope.selectedResource);
                          $scope.$watch(
                            'selectedResource',
                            () => {
                              if (
                                !angular.equals($scope.selectedResource, copy)
                              ) {
                                $scope.changed = true;
                              }
                            },
                            true,
                          );
                          ResourceServerResource.scopes(
                            {
                              realm: $route.current.params.realm,
                              client: client.id,
                              rsrid: resource[0]._id,
                            },
                            (scopes) => {
                              $scope.resourceScopes = scopes;
                            },
                          );
                        },
                      );
                    },
                  );
                }

                ResourceServerPolicy.scopes(
                  {
                    realm: $route.current.params.realm,
                    client: client.id,
                    id: policy.id,
                  },
                  (scopes) => {
                    $scope.selectedScopes = [];
                    for (i = 0; i < scopes.length; i++) {
                      scopes[i].text = scopes[i].name;
                      $scope.selectedScopes.push(scopes[i].id);
                    }
                    var copy = angular.copy($scope.selectedScopes);
                    $scope.$watch(
                      'selectedScopes',
                      () => {
                        if (!angular.equals($scope.selectedScopes, copy)) {
                          $scope.changed = true;
                        }
                      },
                      true,
                    );
                  },
                );
              } else {
                $scope.selectedResource = null;
                var copy = angular.copy($scope.selectedResource);
                $scope.$watch(
                  'selectedResource',
                  () => {
                    if (!angular.equals($scope.selectedResource, copy)) {
                      $scope.changed = true;
                    }
                  },
                  true,
                );
                ResourceServerPolicy.scopes(
                  {
                    realm: $route.current.params.realm,
                    client: client.id,
                    id: policy.id,
                  },
                  (scopes) => {
                    $scope.selectedScopes = [];
                    for (i = 0; i < scopes.length; i++) {
                      scopes[i].text = scopes[i].name;
                      $scope.selectedScopes.push(scopes[i]);
                    }
                    var copy = angular.copy($scope.selectedScopes);
                    $scope.$watch(
                      'selectedScopes',
                      () => {
                        if (!angular.equals($scope.selectedScopes, copy)) {
                          $scope.changed = true;
                        }
                      },
                      true,
                    );
                  },
                );
              }
            },
          );

          ResourceServerPolicy.associatedPolicies(
            {
              realm: $route.current.params.realm,
              client: client.id,
              id: policy.id,
            },
            (policies) => {
              $scope.selectedPolicies = [];
              for (i = 0; i < policies.length; i++) {
                policies[i].text = policies[i].name;
                $scope.selectedPolicies.push(policies[i]);
              }
              var copy = angular.copy($scope.selectedPolicies);
              $scope.$watch(
                'selectedPolicies',
                () => {
                  if (!angular.equals($scope.selectedPolicies, copy)) {
                    $scope.changed = true;
                  }
                },
                true,
              );
            },
          );
        },

        onUpdate: () => {
          if ($scope.selectedResource != null) {
            $scope.policy.resources = [$scope.selectedResource._id];
          } else {
            $scope.policy.resources = [];
          }

          var scopes = [];

          for (i = 0; i < $scope.selectedScopes.length; i++) {
            if ($scope.selectedScopes[i].id) {
              scopes.push($scope.selectedScopes[i].id);
            } else {
              scopes.push($scope.selectedScopes[i]);
            }
          }

          $scope.policy.scopes = scopes;

          var policies = [];

          if ($scope.selectedPolicies) {
            for (i = 0; i < $scope.selectedPolicies.length; i++) {
              policies.push($scope.selectedPolicies[i].id);
            }
          }

          $scope.policy.policies = policies;
          delete $scope.policy.config;
        },

        onInitCreate: (_newPolicy) => {
          policyViewState.state.previousPage.name =
            'authz-add-scope-permission';
          var scopeId = $location.search()['scpid'];

          if (scopeId) {
            ResourceServerScope.get(
              {
                realm: $route.current.params.realm,
                client: client.id,
                id: scopeId,
              },
              (data) => {
                data.text = data.name;
                if (!$scope.policy.scopes) {
                  $scope.selectedScopes = [];
                }
                $scope.selectedScopes.push(data);
              },
            );
          }
        },

        onCreate: () => {
          if ($scope.selectedResource != null) {
            $scope.policy.resources = [$scope.selectedResource._id];
          }

          var scopes = [];

          for (i = 0; i < $scope.selectedScopes.length; i++) {
            if ($scope.selectedScopes[i].id) {
              scopes.push($scope.selectedScopes[i].id);
            } else {
              scopes.push($scope.selectedScopes[i]);
            }
          }

          $scope.policy.scopes = scopes;

          var policies = [];

          if ($scope.selectedPolicies) {
            for (i = 0; i < $scope.selectedPolicies.length; i++) {
              policies.push($scope.selectedPolicies[i].id);
            }
          }

          $scope.policy.policies = policies;
          delete $scope.policy.config;
        },

        onSaveState: (_policy) => {
          policyViewState.state.selectedScopes = $scope.selectedScopes;
          policyViewState.state.selectedResource = $scope.selectedResource;
          policyViewState.state.resourceScopes = $scope.resourceScopes;
        },

        onRestoreState: (_policy) => {
          $scope.selectedScopes = policyViewState.state.selectedScopes;
          $scope.selectedResource = policyViewState.state.selectedResource;
          $scope.resourceScopes = policyViewState.state.resourceScopes;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.controller(
  'ResourceServerPolicyUserDetailCtrl',
  ($scope, $route, realm, client, PolicyController, User) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'user',

        onInit: () => {
          $scope.usersUiSelect = {
            minimumInputLength: 1,
            delay: 500,
            allowClear: true,
            query: (query) => {
              var data = { results: [] };
              if ('' === query.term.trim()) {
                query.callback(data);
                return;
              }
              User.query(
                {
                  realm: $route.current.params.realm,
                  search: query.term.trim(),
                  max: 20,
                },
                (response) => {
                  data.results = response;
                  query.callback(data);
                },
              );
            },
            formatResult: (object, _container, _query) => object.username,
          };

          $scope.selectedUsers = [];

          $scope.selectUser = (user) => {
            if (!user?.id) {
              return;
            }

            $scope.selectedUser = null;

            for (i = 0; i < $scope.selectedUsers.length; i++) {
              if ($scope.selectedUsers[i].id === user.id) {
                return;
              }
            }

            $scope.selectedUsers.push(user);
          };

          $scope.removeFromList = (list, user) => {
            for (i = 0; i < angular.copy(list).length; i++) {
              if (user === list[i]) {
                list.splice(i, 1);
              }
            }
          };
        },

        onInitUpdate: (policy) => {
          var selectedUsers = [];

          if (policy.users) {
            var users = policy.users;

            for (i = 0; i < users.length; i++) {
              User.get(
                { realm: $route.current.params.realm, userId: users[i] },
                (data) => {
                  selectedUsers.push(data);
                  $scope.selectedUsers = angular.copy(selectedUsers);
                },
              );
            }
          }

          $scope.$watch(
            'selectedUsers',
            () => {
              if (!angular.equals($scope.selectedUsers, selectedUsers)) {
                $scope.changed = true;
              } else {
                $scope.changed = false;
              }
            },
            true,
          );
        },

        onUpdate: () => {
          var users = [];

          for (i = 0; i < $scope.selectedUsers.length; i++) {
            users.push($scope.selectedUsers[i].id);
          }

          $scope.policy.users = users;
          delete $scope.policy.config;
        },

        onCreate: () => {
          var users = [];

          for (i = 0; i < $scope.selectedUsers.length; i++) {
            users.push($scope.selectedUsers[i].id);
          }

          $scope.policy.users = users;
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.controller(
  'ResourceServerPolicyClientDetailCtrl',
  ($scope, $route, realm, client, PolicyController, Client) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'client',

        onInit: () => {
          clientSelectControl($scope, $route.current.params.realm, Client);

          $scope.selectedClients = [];

          $scope.selectClient = (client) => {
            if (!client?.id) {
              return;
            }

            $scope.selectedClient = null;

            for (var i = 0; i < $scope.selectedClients.length; i++) {
              if ($scope.selectedClients[i].id === client.id) {
                return;
              }
            }

            $scope.selectedClients.push(client);
          };

          $scope.removeFromList = (client) => {
            var index = $scope.selectedClients.indexOf(client);
            if (index !== -1) {
              $scope.selectedClients.splice(index, 1);
            }
          };
        },

        onInitUpdate: (policy) => {
          var selectedClients = [];

          if (policy.clients) {
            var clients = policy.clients;

            for (var i = 0; i < clients.length; i++) {
              Client.get(
                { realm: $route.current.params.realm, client: clients[i] },
                (data) => {
                  selectedClients.push(data);
                  $scope.selectedClients = angular.copy(selectedClients);
                },
              );
            }
          }

          $scope.$watch(
            'selectedClients',
            () => {
              if (!angular.equals($scope.selectedClients, selectedClients)) {
                $scope.changed = true;
              } else {
                $scope.changed = false;
              }
            },
            true,
          );
        },

        onUpdate: () => {
          var clients = [];

          for (var i = 0; i < $scope.selectedClients.length; i++) {
            clients.push($scope.selectedClients[i].id);
          }

          $scope.policy.clients = clients;
          delete $scope.policy.config;
        },

        onInitCreate: () => {
          var selectedClients = [];

          $scope.$watch(
            'selectedClients',
            () => {
              if (!angular.equals($scope.selectedClients, selectedClients)) {
                $scope.changed = true;
              }
            },
            true,
          );
        },

        onCreate: () => {
          var clients = [];

          for (var i = 0; i < $scope.selectedClients.length; i++) {
            clients.push($scope.selectedClients[i].id);
          }

          $scope.policy.clients = clients;
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.controller(
  'ResourceServerPolicyRoleDetailCtrl',
  (
    $scope,
    $route,
    realm,
    client,
    Client,
    ClientRole,
    PolicyController,
    Role,
    RoleById,
  ) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'role',

        onInit: () => {
          Role.query({ realm: $route.current.params.realm }, (data) => {
            $scope.roles = data;
          });

          Client.query({ realm: $route.current.params.realm }, (data) => {
            $scope.clients = data;
          });

          $scope.selectedRoles = [];

          $scope.selectRole = (role) => {
            if (!role?.id) {
              return;
            }

            $scope.selectedRole = null;

            for (i = 0; i < $scope.selectedRoles.length; i++) {
              if ($scope.selectedRoles[i].id === role.id) {
                return;
              }
            }

            $scope.selectedRoles.push(role);

            var clientRoles = [];

            if ($scope.clientRoles) {
              for (i = 0; i < $scope.clientRoles.length; i++) {
                if ($scope.clientRoles[i].id !== role.id) {
                  clientRoles.push($scope.clientRoles[i]);
                }
              }
              $scope.clientRoles = clientRoles;
            }
          };

          $scope.removeFromList = (role) => {
            if (
              $scope.clientRoles &&
              $scope.selectedClient &&
              $scope.selectedClient.id === role.containerId
            ) {
              $scope.clientRoles.push(role);
            }
            var index = $scope.selectedRoles.indexOf(role);
            if (index !== -1) {
              $scope.selectedRoles.splice(index, 1);
            }
          };

          $scope.selectClient = () => {
            if (!$scope.selectedClient) {
              $scope.clientRoles = [];
              return;
            }
            ClientRole.query(
              {
                realm: $route.current.params.realm,
                client: $scope.selectedClient.id,
              },
              (data) => {
                var roles = [];

                for (j = 0; j < data.length; j++) {
                  var defined = false;

                  for (i = 0; i < $scope.selectedRoles.length; i++) {
                    if ($scope.selectedRoles[i].id === data[j].id) {
                      defined = true;
                      break;
                    }
                  }

                  if (!defined) {
                    data[j].container = {};
                    data[j].container.name = $scope.selectedClient.clientId;
                    roles.push(data[j]);
                  }
                }
                $scope.clientRoles = roles;
              },
            );
          };
        },

        onInitUpdate: (policy) => {
          var selectedRoles = [];

          if (policy.roles) {
            var roles = policy.roles;

            for (i = 0; i < roles.length; i++) {
              RoleById.get(
                { realm: $route.current.params.realm, role: roles[i].id },
                (data) => {
                  for (i = 0; i < roles.length; i++) {
                    if (roles[i].id === data.id) {
                      data.required = !!roles[i].required;
                    }
                  }
                  for (i = 0; i < $scope.clients.length; i++) {
                    if ($scope.clients[i].id === data.containerId) {
                      data.container = {};
                      data.container.name = $scope.clients[i].clientId;
                    }
                  }
                  selectedRoles.push(data);
                  $scope.selectedRoles = angular.copy(selectedRoles);
                },
              );
            }
          }

          $scope.$watch(
            'selectedRoles',
            () => {
              if (!angular.equals($scope.selectedRoles, selectedRoles)) {
                $scope.changed = true;
              } else {
                $scope.changed = false;
              }
            },
            true,
          );
        },

        onUpdate: () => {
          var roles = [];

          for (i = 0; i < $scope.selectedRoles.length; i++) {
            var role = {};
            role.id = $scope.selectedRoles[i].id;
            if ($scope.selectedRoles[i].required) {
              role.required = $scope.selectedRoles[i].required;
            }
            roles.push(role);
          }

          $scope.policy.roles = roles;
          delete $scope.policy.config;
        },

        onCreate: () => {
          var roles = [];

          for (i = 0; i < $scope.selectedRoles.length; i++) {
            var role = {};
            role.id = $scope.selectedRoles[i].id;
            if ($scope.selectedRoles[i].required) {
              role.required = $scope.selectedRoles[i].required;
            }
            roles.push(role);
          }

          $scope.policy.roles = roles;
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );

    $scope.hasRealmRole = () => {
      for (i = 0; i < $scope.selectedRoles.length; i++) {
        if (!$scope.selectedRoles[i].clientRole) {
          return true;
        }
      }
      return false;
    };

    $scope.hasClientRole = () => {
      for (i = 0; i < $scope.selectedRoles.length; i++) {
        if ($scope.selectedRoles[i].clientRole) {
          return true;
        }
      }
      return false;
    };
  },
);

module.controller(
  'ResourceServerPolicyGroupDetailCtrl',
  (
    $scope,
    $route,
    realm,
    client,
    _Client,
    Groups,
    Group,
    PolicyController,
    Notifications,
    $translate,
  ) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'group',

        onInit: () => {
          $scope.tree = [];

          Groups.query({ realm: $route.current.params.realm }, (groups) => {
            $scope.groups = groups;
            $scope.groupList = [
              {
                id: 'realm',
                name: $translate.instant('groups'),
                subGroups: groups,
              },
            ];
          });

          var isLeaf = (node) =>
            node.id !== 'realm' &&
            (!node.subGroups || node.subGroups.length === 0);

          $scope.getGroupClass = (node) => {
            if (node.id === 'realm') {
              return 'pficon pficon-users';
            }
            if (isLeaf(node)) {
              return 'normal';
            }
            if (node.subGroups.length && node.collapsed) return 'collapsed';
            if (node.subGroups.length && !node.collapsed) return 'expanded';
            return 'collapsed';
          };

          $scope.getSelectedClass = (node) => {
            if (node.selected) {
              return 'selected';
            } else if ($scope.cutNode && $scope.cutNode.id === node.id) {
              return 'cut';
            }
            return undefined;
          };

          $scope.selectGroup = (group) => {
            for (i = 0; i < $scope.selectedGroups.length; i++) {
              if ($scope.selectedGroups[i].id === group.id) {
                return;
              }
            }
            if (group.id === 'realm') {
              Notifications.error('You must choose a group');
              return;
            }
            $scope.selectedGroups.push({ id: group.id, path: group.path });
            $scope.changed = true;
          };

          $scope.extendChildren = (_group) => {
            $scope.changed = true;
          };

          $scope.removeFromList = (group) => {
            var index = $scope.selectedGroups.indexOf(group);
            if (index !== -1) {
              $scope.selectedGroups.splice(index, 1);
              $scope.changed = true;
            }
          };
        },

        onInitCreate: (_policy) => {
          var selectedGroups = [];

          $scope.selectedGroups = angular.copy(selectedGroups);

          $scope.$watch(
            'selectedGroups',
            () => {
              if (!angular.equals($scope.selectedGroups, selectedGroups)) {
                $scope.changed = true;
              } else {
                $scope.changed = PolicyController.isNewAssociatedPolicy();
              }
            },
            true,
          );
        },

        onInitUpdate: (policy) => {
          $scope.selectedGroups = policy.groups;

          angular.forEach($scope.selectedGroups, (group, _index) => {
            Group.get(
              { realm: $route.current.params.realm, groupId: group.id },
              (existing) => {
                group.path = existing.path;
              },
            );
          });

          $scope.$watch(
            'selectedGroups',
            () => {
              if (!$scope.changed) {
                return;
              }
              if (!angular.equals($scope.selectedGroups, selectedGroups)) {
                $scope.changed = true;
              } else {
                $scope.changed = false;
              }
            },
            true,
          );
        },

        onUpdate: () => {
          $scope.policy.groups = $scope.selectedGroups;
          delete $scope.policy.config;
        },

        onCreate: () => {
          $scope.policy.groups = $scope.selectedGroups;
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.controller(
  'ResourceServerPolicyJSDetailCtrl',
  (
    $scope,
    _$route,
    _$location,
    realm,
    PolicyController,
    client,
    serverInfo,
  ) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'js',

        onInit: () => {
          $scope.readOnly = !serverInfo.featureEnabled('UPLOAD_SCRIPTS');
          $scope.initEditor = (editor) => {
            editor.$blockScrolling = Infinity;
            editor.setReadOnly($scope.readOnly);
            var session = editor.getSession();
            session.setMode('ace/mode/javascript');
          };
        },

        onInitUpdate: (_policy) => {},

        onUpdate: () => {
          delete $scope.policy.config;
        },

        onInitCreate: (_newPolicy) => {},

        onCreate: () => {
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.controller(
  'ResourceServerPolicyTimeDetailCtrl',
  ($scope, _$route, _$location, realm, PolicyController, client) => {
    function clearEmptyStrings() {
      if (
        $scope.policy.notBefore !== undefined &&
        $scope.policy.notBefore.trim() === ''
      ) {
        $scope.policy.notBefore = null;
      }
      if (
        $scope.policy.notOnOrAfter !== undefined &&
        $scope.policy.notOnOrAfter.trim() === ''
      ) {
        $scope.policy.notOnOrAfter = null;
      }
    }

    PolicyController.onInit(
      {
        getPolicyType: () => 'time',

        onInit: () => {},

        onInitUpdate: (policy) => {
          if (policy.dayMonth) {
            policy.dayMonth = parseInt(policy.dayMonth, 10);
          }
          if (policy.dayMonthEnd) {
            policy.dayMonthEnd = parseInt(policy.dayMonthEnd, 10);
          }
          if (policy.month) {
            policy.month = parseInt(policy.month, 10);
          }
          if (policy.monthEnd) {
            policy.monthEnd = parseInt(policy.monthEnd, 10);
          }
          if (policy.year) {
            policy.year = parseInt(policy.year, 10);
          }
          if (policy.yearEnd) {
            policy.yearEnd = parseInt(policy.yearEnd, 10);
          }
          if (policy.hour) {
            policy.hour = parseInt(policy.hour, 10);
          }
          if (policy.hourEnd) {
            policy.hourEnd = parseInt(policy.hourEnd, 10);
          }
          if (policy.minute) {
            policy.minute = parseInt(policy.minute, 10);
          }
          if (policy.minuteEnd) {
            policy.minuteEnd = parseInt(policy.minuteEnd, 10);
          }
        },

        onUpdate: () => {
          clearEmptyStrings();
          delete $scope.policy.config;
        },

        onInitCreate: (_newPolicy) => {},

        onCreate: () => {
          clearEmptyStrings();
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );

    $scope.isRequired = () => {
      var policy = $scope.policy;

      if (!policy) {
        return true;
      }

      if (
        policy.notOnOrAfter ||
        policy.notBefore ||
        policy.dayMonth ||
        policy.month ||
        policy.year ||
        policy.hour ||
        policy.minute
      ) {
        return false;
      }
      return true;
    };
  },
);

module.controller(
  'ResourceServerPolicyAggregateDetailCtrl',
  (
    $scope,
    $route,
    _$location,
    realm,
    PolicyController,
    ResourceServerPolicy,
    client,
    _PolicyProvider,
    policyViewState,
  ) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'aggregate',

        onInit: () => {
          $scope.policiesUiSelect = {
            minimumInputLength: 1,
            delay: 500,
            allowClear: true,
            query: (query) => {
              var data = { results: [] };
              if ('' === query.term.trim()) {
                query.callback(data);
                return;
              }
              $scope.query = {
                realm: realm.realm,
                client: client.id,
                permission: false,
                name: query.term.trim(),
                max: 20,
                first: 0,
              };
              ResourceServerPolicy.query($scope.query, (response) => {
                data.results = response;
                query.callback(data);
              });
            },
            formatResult: (object, _container, _query) => {
              object.text = object.name;
              return object.name;
            },
          };
        },

        onInitUpdate: (policy) => {
          ResourceServerPolicy.associatedPolicies(
            {
              realm: $route.current.params.realm,
              client: client.id,
              id: policy.id,
            },
            (policies) => {
              $scope.selectedPolicies = [];
              for (i = 0; i < policies.length; i++) {
                policies[i].text = policies[i].name;
                $scope.selectedPolicies.push(policies[i]);
              }
              var copy = angular.copy($scope.selectedPolicies);
              $scope.$watch(
                'selectedPolicies',
                () => {
                  if (!angular.equals($scope.selectedPolicies, copy)) {
                    $scope.changed = true;
                  }
                },
                true,
              );
            },
          );
        },

        onUpdate: () => {
          var policies = [];

          for (i = 0; i < $scope.selectedPolicies.length; i++) {
            policies.push($scope.selectedPolicies[i].id);
          }

          $scope.policy.policies = policies;
          delete $scope.policy.config;
        },

        onInitCreate: (_newPolicy) => {
          policyViewState.state.previousPage.name =
            'authz-add-aggregated-policy';
        },

        onCreate: () => {
          var policies = [];

          for (i = 0; i < $scope.selectedPolicies.length; i++) {
            policies.push($scope.selectedPolicies[i].id);
          }

          $scope.policy.policies = policies;
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.controller(
  'ResourceServerPolicyClientScopeDetailCtrl',
  ($scope, $route, realm, client, ClientScope, PolicyController) => {
    PolicyController.onInit(
      {
        getPolicyType: () => 'client-scope',

        onInit: () => {
          ClientScope.query({ realm: $route.current.params.realm }, (data) => {
            $scope.clientScopes = data;
          });

          $scope.selectedClientScopes = [];

          $scope.selectClientScope = (clientScope) => {
            if (!clientScope?.id) {
              return;
            }

            $scope.selectedClientScope = null;

            for (i = 0; i < $scope.selectedClientScopes.length; i++) {
              if ($scope.selectedClientScopes[i].id === clientScope.id) {
                return;
              }
            }

            $scope.selectedClientScopes.push(clientScope);
          };

          $scope.removeFromList = (clientScope) => {
            var index = $scope.selectedClientScopes.indexOf(clientScope);
            if (index !== -1) {
              $scope.selectedClientScopes.splice(index, 1);
            }
          };
        },

        onInitUpdate: (policy) => {
          var selectedClientScopes = [];

          if (policy.clientScopes) {
            var clientScopes = policy.clientScopes;

            for (i = 0; i < clientScopes.length; i++) {
              ClientScope.get(
                {
                  realm: $route.current.params.realm,
                  clientScope: clientScopes[i].id,
                },
                (data) => {
                  for (i = 0; i < clientScopes.length; i++) {
                    if (clientScopes[i].id === data.id) {
                      data.required = !!clientScopes[i].required;
                    }
                  }
                  selectedClientScopes.push(data);
                  $scope.selectedClientScopes =
                    angular.copy(selectedClientScopes);
                },
              );
            }
          }

          $scope.$watch(
            'selectedClientScopes',
            () => {
              if (
                !angular.equals(
                  $scope.selectedClientScopes,
                  selectedClientScopes,
                )
              ) {
                $scope.changed = true;
              } else {
                $scope.changed = false;
              }
            },
            true,
          );
        },

        onUpdate: () => {
          var clientScopes = [];

          for (i = 0; i < $scope.selectedClientScopes.length; i++) {
            var clientScope = {};
            clientScope.id = $scope.selectedClientScopes[i].id;
            if ($scope.selectedClientScopes[i].required) {
              clientScope.required = $scope.selectedClientScopes[i].required;
            }
            clientScopes.push(clientScope);
          }

          $scope.policy.clientScopes = clientScopes;
          delete $scope.policy.config;
        },

        onCreate: () => {
          var clientScopes = [];

          for (i = 0; i < $scope.selectedClientScopes.length; i++) {
            var clientScope = {};
            clientScope.id = $scope.selectedClientScopes[i].id;
            if ($scope.selectedClientScopes[i].required) {
              clientScope.required = $scope.selectedClientScopes[i].required;
            }
            clientScopes.push(clientScope);
          }

          $scope.policy.clientScopes = clientScopes;
          delete $scope.policy.config;
        },
      },
      realm,
      client,
      $scope,
    );
  },
);

module.service(
  'PolicyController',
  (
    _$http,
    $route,
    $location,
    ResourceServer,
    ResourceServerPolicy,
    ResourceServerPermission,
    AuthzDialog,
    Notifications,
    policyViewState,
    PolicyProvider,
    viewState,
  ) => {
    var PolicyController = {};

    PolicyController.isNewAssociatedPolicy = () =>
      $route.current.params['new_policy'] != null;

    PolicyController.isBackNewAssociatedPolicy = () =>
      $route.current.params['back'] != null;

    PolicyController.onInit = function (delegate, realm, client, $scope) {
      $scope.policyProviders = [];

      PolicyProvider.query(
        {
          realm: $route.current.params.realm,
          client: client.id,
        },
        (data) => {
          for (i = 0; i < data.length; i++) {
            if (data[i].type !== 'resource' && data[i].type !== 'scope') {
              $scope.policyProviders.push(data[i]);
            }
          }
        },
      );

      if (
        (!policyViewState.state ||
          !PolicyController.isBackNewAssociatedPolicy()) &&
        !PolicyController.isNewAssociatedPolicy()
      ) {
        policyViewState.state = {};
      }

      if (!policyViewState.state.previousPage) {
        policyViewState.state.previousPage = {};
      }

      $scope.policyViewState = policyViewState;

      $scope.addPolicy = (policyType) => {
        policyViewState.state.policy = $scope.policy;

        if (delegate.onSaveState) {
          delegate.onSaveState($scope.policy);
        }

        if ($scope.selectedPolicies) {
          policyViewState.state.selectedPolicies = $scope.selectedPolicies;
        }
        var previousUrl = window.location.href.substring(
          window.location.href.indexOf('/realms'),
        );

        if (previousUrl.indexOf('back=true') === -1) {
          previousUrl = `${previousUrl + (previousUrl.indexOf('?') === -1 ? '?' : '&')}back=true`;
        }
        policyViewState.state.previousUrl = previousUrl;
        $location.url(
          `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/policy/${policyType.type}/create?new_policy=true`,
        );
      };

      $scope.detailPolicy = (policy) => {
        policyViewState.state.policy = $scope.policy;
        if (delegate.onSaveState) {
          delegate.onSaveState($scope.policy);
        }
        if ($scope.selectedPolicies) {
          policyViewState.state.selectedPolicies = $scope.selectedPolicies;
        }
        var previousUrl = window.location.href.substring(
          window.location.href.indexOf('/realms'),
        );

        if (previousUrl.indexOf('back=true') === -1) {
          previousUrl = `${previousUrl + (previousUrl.indexOf('?') === -1 ? '?' : '&')}back=true`;
        }
        policyViewState.state.previousUrl = previousUrl;
        $location.url(
          `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/policy/${policy.type}/${policy.id}?new_policy=true`,
        );
      };

      $scope.removePolicy = (list, policy) => {
        for (i = 0; i < angular.copy(list).length; i++) {
          if (policy.id === list[i].id) {
            list.splice(i, 1);
          }
        }
      };

      $scope.selectPolicy = (policy) => {
        if (!policy?.id) {
          return;
        }

        if (!$scope.selectedPolicies) {
          $scope.selectedPolicies = [];
        }

        $scope.selectedPolicy = null;

        for (i = 0; i < $scope.selectedPolicies.length; i++) {
          if ($scope.selectedPolicies[i].id === policy.id) {
            return;
          }
        }

        $scope.selectedPolicies.push(policy);
      };

      $scope.createNewPolicy = () => {
        $scope.showNewPolicy = true;
      };

      $scope.cancelCreateNewPolicy = () => {
        $scope.showNewPolicy = false;
      };

      $scope.historyBackOnSaveOrCancel =
        PolicyController.isNewAssociatedPolicy();

      if (!delegate.isPermission) {
        delegate.isPermission = () => false;
      }

      var service = ResourceServerPolicy;

      if (delegate.isPermission()) {
        service = ResourceServerPermission;
      }

      $scope.realm = realm;
      $scope.client = client;

      $scope.decisionStrategies = ['AFFIRMATIVE', 'UNANIMOUS', 'CONSENSUS'];
      $scope.logics = ['POSITIVE', 'NEGATIVE'];

      delegate.onInit();

      ResourceServer.get(
        {
          realm: $route.current.params.realm,
          client: client.id,
        },
        (data) => {
          $scope.server = data;

          var policyId = $route.current.params.id;

          if (!policyId) {
            $scope.create = true;

            var policy = {};

            policy.type = delegate.getPolicyType();
            policy.config = {};
            policy.logic = 'POSITIVE';
            policy.decisionStrategy = 'UNANIMOUS';

            $scope.changed =
              $scope.historyBackOnSaveOrCancel ||
              PolicyController.isBackNewAssociatedPolicy();

            if (
              viewState.state != null &&
              viewState.state.previousUrl != null
            ) {
              $scope.previousUrl = viewState.state.previousUrl;
              policyViewState.state.rootUrl = $scope.previousUrl;
              viewState.state = {};
            }

            $scope.policy = angular.copy(policy);

            $scope.$watch(
              'policy',
              () => {
                if (!angular.equals($scope.policy, policy)) {
                  $scope.changed = true;
                }
              },
              true,
            );

            if (PolicyController.isBackNewAssociatedPolicy()) {
              if (delegate.onRestoreState) {
                delegate.onRestoreState($scope.policy);
              }
              this.restoreState($scope);
            } else if (delegate.onInitCreate) {
              delegate.onInitCreate(policy);
            }

            $scope.save = () => {
              this.checkNameAvailability(() => {
                if (delegate.onCreate) {
                  delegate.onCreate();
                }
                service.save(
                  {
                    realm: realm.realm,
                    client: client.id,
                    type: $scope.policy.type,
                  },
                  $scope.policy,
                  (data) => {
                    if (delegate.isPermission()) {
                      if (
                        $scope.historyBackOnSaveOrCancel ||
                        policyViewState.state.rootUrl != null
                      ) {
                        if (policyViewState.state.rootUrl != null) {
                          $location.url(policyViewState.state.rootUrl);
                        } else {
                          policyViewState.state.newPolicyName =
                            $scope.policy.name;
                          $location.url(policyViewState.state.previousUrl);
                        }
                      } else {
                        $location.url(
                          `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/permission/${$scope.policy.type}/${data.id}`,
                        );
                      }
                      Notifications.success('The permission has been created.');
                    } else {
                      if ($scope.historyBackOnSaveOrCancel) {
                        policyViewState.state.newPolicyName =
                          $scope.policy.name;
                        $location.url(policyViewState.state.previousUrl);
                      } else {
                        $location.url(
                          `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/policy/${$scope.policy.type}/${data.id}`,
                        );
                      }
                      Notifications.success('The policy has been created.');
                    }
                  },
                );
              });
            };

            $scope.reset = () => {
              if (delegate.isPermission()) {
                if (
                  $scope.historyBackOnSaveOrCancel ||
                  policyViewState.state.rootUrl != null
                ) {
                  if (policyViewState.state.rootUrl != null) {
                    $location.url(policyViewState.state.rootUrl);
                  } else {
                    $location.url(policyViewState.state.previousUrl);
                  }
                } else {
                  $location.url(
                    `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/permission/`,
                  );
                }
              } else {
                if ($scope.historyBackOnSaveOrCancel) {
                  $location.url(policyViewState.state.previousUrl);
                } else {
                  $location.url(
                    `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/policy/`,
                  );
                }
              }
            };
          } else {
            service.get(
              {
                realm: realm.realm,
                client: client.id,
                type: delegate.getPolicyType(),
                id: $route.current.params.id,
              },
              (data) => {
                $scope.originalPolicy = data;
                var policy = angular.copy(data);

                $scope.changed =
                  $scope.historyBackOnSaveOrCancel ||
                  PolicyController.isBackNewAssociatedPolicy();
                $scope.policy = angular.copy(policy);

                if (PolicyController.isBackNewAssociatedPolicy()) {
                  if (delegate.onRestoreState) {
                    delegate.onRestoreState($scope.policy);
                  }
                  this.restoreState($scope);
                } else if (delegate.onInitUpdate) {
                  delegate.onInitUpdate($scope.policy);
                }

                $scope.$watch(
                  'policy',
                  () => {
                    if (!angular.equals($scope.policy, policy)) {
                      $scope.changed = true;
                    }
                  },
                  true,
                );

                $scope.save = () => {
                  this.checkNameAvailability(() => {
                    if (delegate.onUpdate) {
                      delegate.onUpdate();
                    }
                    service.update(
                      {
                        realm: realm.realm,
                        client: client.id,
                        type: $scope.policy.type,
                        id: $scope.policy.id,
                      },
                      $scope.policy,
                      () => {
                        if (delegate.isPermission()) {
                          if ($scope.historyBackOnSaveOrCancel) {
                            $location.url(policyViewState.state.previousUrl);
                          } else {
                            $location.url(
                              `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/permission/${$scope.policy.type}/${$scope.policy.id}`,
                            );
                          }
                          $route.reload();
                          Notifications.success(
                            'The permission has been updated.',
                          );
                        } else {
                          if ($scope.historyBackOnSaveOrCancel) {
                            $location.url(policyViewState.state.previousUrl);
                          } else {
                            $location.url(
                              `/realms/${realm.realm}/clients/${client.id}/authz/resource-server/policy/${$scope.policy.type}/${$scope.policy.id}`,
                            );
                          }
                          $route.reload();
                          Notifications.success('The policy has been updated.');
                        }
                      },
                    );
                  });
                };

                $scope.reset = () => {
                  if ($scope.historyBackOnSaveOrCancel) {
                    $location.url(policyViewState.state.previousUrl);
                  } else {
                    var freshPolicy = angular.copy(data);

                    if (delegate.onInitUpdate) {
                      delegate.onInitUpdate(freshPolicy);
                    }

                    $scope.policy = angular.copy(freshPolicy);
                    $scope.changed = false;
                  }
                };
              },
            );

            $scope.remove = () => {
              Policies.delete(
                ResourceServerPolicy,
                $route.current.params.realm,
                client,
                $scope,
                AuthzDialog,
                $location,
                Notifications,
                $route,
                delegate.isPermission(),
              );
            };
          }
        },
      );

      $scope.checkNewNameAvailability = () => {
        this.checkNameAvailability(() => {});
      };

      this.checkNameAvailability = (onSuccess) => {
        if (!$scope.policy.name || $scope.policy.name.trim().length === 0) {
          return;
        }
        ResourceServerPolicy.search(
          {
            realm: $route.current.params.realm,
            client: client.id,
            name: $scope.policy.name,
          },
          (data) => {
            if (data?.id && data.id !== $scope.policy.id) {
              Notifications.error(
                'Name already in use by another policy or permission, please choose another one.',
              );
            } else {
              onSuccess();
            }
          },
        );
      };

      this.restoreState = ($scope) => {
        $scope.policy.name = policyViewState.state.policy.name;
        $scope.policy.description = policyViewState.state.policy.description;
        $scope.policy.decisionStrategy =
          policyViewState.state.policy.decisionStrategy;
        $scope.policy.logic = policyViewState.state.policy.logic;
        $scope.selectedPolicies = policyViewState.state.selectedPolicies;

        if (!$scope.selectedPolicies) {
          $scope.selectedPolicies = [];
        }

        $scope.changed = true;
        var previousPage = policyViewState.state.previousPage;

        if (policyViewState.state.newPolicyName) {
          ResourceServerPolicy.query(
            {
              realm: realm.realm,
              client: client.id,
              permission: false,
              name: policyViewState.state.newPolicyName,
              max: 20,
              first: 0,
            },
            (response) => {
              for (i = 0; i < response.length; i++) {
                if (response[i].name === policyViewState.state.newPolicyName) {
                  response[i].text = response[i].name;
                  $scope.selectedPolicies.push(response[i]);
                }
              }

              var rootUrl = policyViewState.state.rootUrl;
              policyViewState.state = {};
              policyViewState.state.previousPage = previousPage;
              policyViewState.state.rootUrl = rootUrl;
            },
          );
        } else {
          var rootUrl = policyViewState.state.rootUrl;
          policyViewState.state = {};
          policyViewState.state.previousPage = previousPage;
          policyViewState.state.rootUrl = rootUrl;
        }
      };
    };

    return PolicyController;
  },
);

module.controller(
  'PolicyEvaluateCtrl',
  (
    $scope,
    $http,
    $route,
    _$location,
    realm,
    clients,
    roles,
    ResourceServer,
    client,
    ResourceServerResource,
    ResourceServerScope,
    User,
    Notifications,
  ) => {
    $scope.realm = realm;
    $scope.client = client;
    $scope.clients = clients;
    $scope.roles = roles;
    $scope.authzRequest = {};
    $scope.authzRequest.resources = [];
    $scope.authzRequest.context = {};
    $scope.authzRequest.context.attributes = {};
    $scope.authzRequest.roleIds = [];
    $scope.resultUrl = `${resourceUrl}/partials/authz/policy/resource-server-policy-evaluate-result.html`;

    $scope.addContextAttribute = () => {
      if (
        !$scope.newContextAttribute.value ||
        $scope.newContextAttribute.value === ''
      ) {
        Notifications.error('You must provide a value to a context attribute.');
        return;
      }

      $scope.authzRequest.context.attributes[$scope.newContextAttribute.key] =
        $scope.newContextAttribute.value;
      delete $scope.newContextAttribute;
    };

    $scope.removeContextAttribute = (key) => {
      delete $scope.authzRequest.context.attributes[key];
    };

    $scope.getContextAttribute = (key) => {
      for (i = 0; i < $scope.defaultContextAttributes.length; i++) {
        if ($scope.defaultContextAttributes[i].key === key) {
          return $scope.defaultContextAttributes[i];
        }
      }

      return $scope.authzRequest.context.attributes[key];
    };

    $scope.getContextAttributeName = (key) => {
      var attribute = $scope.getContextAttribute(key);

      if (!attribute.name) {
        return key;
      }

      return attribute.name;
    };

    $scope.defaultContextAttributes = [
      {
        key: 'custom',
        name: 'Custom Attribute...',
        custom: true,
      },
      {
        key: 'kc.identity.authc.method',
        name: 'Authentication Method',
        values: [
          {
            key: 'pwd',
            name: 'Password',
          },
          {
            key: 'otp',
            name: 'One-Time Password',
          },
          {
            key: 'kbr',
            name: 'Kerberos',
          },
        ],
      },
      {
        key: 'kc.realm.name',
        name: 'Realm',
      },
      {
        key: 'kc.time.date_time',
        name: 'Date/Time (MM/dd/yyyy hh:mm:ss)',
      },
      {
        key: 'kc.client.network.ip_address',
        name: 'Client IPv4 Address',
      },
      {
        key: 'kc.client.network.host',
        name: 'Client Host',
      },
      {
        key: 'kc.client.user_agent',
        name: 'Client/User Agent',
      },
    ];

    $scope.isDefaultContextAttribute = () => {
      if (!$scope.newContextAttribute) {
        return true;
      }

      if ($scope.newContextAttribute.custom) {
        return false;
      }

      if (!$scope.getContextAttribute($scope.newContextAttribute.key).custom) {
        return true;
      }

      return false;
    };

    $scope.selectDefaultContextAttribute = () => {
      $scope.newContextAttribute = angular.copy($scope.newContextAttribute);
    };

    $scope.setApplyToResourceType = () => {
      delete $scope.newResource;
      $scope.authzRequest.resources = [];
    };

    $scope.addResource = () => {
      var resource = angular.copy($scope.newResource);

      if (!resource) {
        resource = {};
      }

      delete resource.text;

      if (
        !$scope.newScopes ||
        (resource._id != null &&
          $scope.newScopes.length > 0 &&
          $scope.newScopes[0].id)
      ) {
        $scope.newScopes = [];
      }

      var scopes = [];

      for (i = 0; i < $scope.newScopes.length; i++) {
        if ($scope.newScopes[i].name) {
          scopes.push($scope.newScopes[i].name);
        } else {
          scopes.push($scope.newScopes[i]);
        }
      }

      resource.scopes = scopes;

      $scope.authzRequest.resources.push(resource);

      delete $scope.newResource;
      delete $scope.newScopes;
    };

    $scope.removeResource = (index) => {
      $scope.authzRequest.resources.splice(index, 1);
    };

    $scope.resolveScopes = () => {
      if ($scope.newResource._id) {
        $scope.newResource.scopes = [];
        $scope.scopes = [];
        ResourceServerResource.scopes(
          {
            realm: $route.current.params.realm,
            client: client.id,
            rsrid: $scope.newResource._id,
          },
          (data) => {
            $scope.scopes = data;
          },
        );
      }
    };

    $scope.reevaluate = () => {
      if ($scope.authzRequest.entitlements) {
        $scope.entitlements();
      } else {
        $scope.save();
      }
    };

    $scope.showAuthzData = () => {
      $scope.showRpt = true;
    };

    $scope.save = () => {
      $scope.authzRequest.entitlements = false;
      if ($scope.applyResourceType) {
        if (!$scope.newResource) {
          $scope.newResource = {};
        }
        if (
          !$scope.newScopes ||
          ($scope.newResource._id != null &&
            $scope.newScopes.length > 0 &&
            $scope.newScopes[0].id)
        ) {
          $scope.newScopes = [];
        }

        var scopes = angular.copy($scope.newScopes);

        for (i = 0; i < scopes.length; i++) {
          delete scopes[i].text;
        }

        $scope.authzRequest.resources[0].scopes = scopes;
      }

      $http
        .post(
          `${authUrl}/admin/realms/${$route.current.params.realm}/clients/${client.id}/authz/resource-server/policy/evaluate`,
          $scope.authzRequest,
        )
        .then((response) => {
          $scope.evaluationResult = response.data;
          $scope.showResultTab();
        });
    };

    $scope.entitlements = () => {
      $scope.authzRequest.entitlements = true;
      $http
        .post(
          `${authUrl}/admin/realms/${$route.current.params.realm}/clients/${client.id}/authz/resource-server/policy/evaluate`,
          $scope.authzRequest,
        )
        .then((response) => {
          $scope.evaluationResult = response.data;
          $scope.showResultTab();
        });
    };

    $scope.showResultTab = () => {
      $scope.showResult = true;
      $scope.showRpt = false;
    };

    $scope.showRequestTab = () => {
      $scope.showResult = false;
      $scope.showRpt = false;
    };

    $scope.usersUiSelect = {
      minimumInputLength: 1,
      delay: 500,
      allowClear: true,
      query: (query) => {
        var data = { results: [] };
        if ('' === query.term.trim()) {
          query.callback(data);
          return;
        }
        User.query(
          {
            realm: $route.current.params.realm,
            search: query.term.trim(),
            max: 20,
          },
          (response) => {
            data.results = response;
            query.callback(data);
          },
        );
      },
      formatResult: (object, _container, _query) => {
        object.text = object.username;
        return object.username;
      },
    };

    $scope.resourcesUiSelect = {
      minimumInputLength: 1,
      delay: 500,
      allowClear: true,
      id: (resource) => resource._id,
      query: (query) => {
        var data = { results: [] };
        if ('' === query.term.trim()) {
          query.callback(data);
          return;
        }
        $scope.query = {
          realm: realm.realm,
          client: client.id,
          name: query.term.trim(),
          deep: false,
          max: 20,
          first: 0,
        };
        ResourceServerResource.query($scope.query, (response) => {
          data.results = response;
          query.callback(data);
        });
      },
      formatResult: (object, _container, _query) => {
        object.text = object.name;
        return object.name;
      },
    };

    $scope.scopesUiSelect = {
      minimumInputLength: 1,
      delay: 500,
      allowClear: true,
      query: (query) => {
        var data = { results: [] };
        if ('' === query.term.trim()) {
          query.callback(data);
          return;
        }
        $scope.query = {
          realm: realm.realm,
          client: client.id,
          name: query.term.trim(),
          deep: false,
          max: 20,
          first: 0,
        };
        ResourceServerScope.query($scope.query, (response) => {
          data.results = response;
          query.callback(data);
        });
      },
      formatResult: (object, _container, _query) => {
        object.text = object.name;
        return object.name;
      },
    };

    ResourceServer.get(
      {
        realm: $route.current.params.realm,
        client: client.id,
      },
      (data) => {
        $scope.server = data;
      },
    );

    $scope.selectUser = (user) => {
      if (!user?.id) {
        $scope.selectedUser = null;
        $scope.authzRequest.userId = '';
        return;
      }

      $scope.authzRequest.userId = user.id;
    };

    $scope.reset = () => {
      $scope.authzRequest = angular.copy(authzRequest);
      $scope.changed = false;
    };
  },
);

getManageClientId = (realm) => {
  if (realm.realm === masterRealm) {
    return 'master-realm';
  } else {
    return 'realm-management';
  }
};

module.controller(
  'RealmRolePermissionsCtrl',
  (
    $scope,
    _$http,
    _$route,
    $location,
    realm,
    role,
    RoleManagementPermissions,
    Client,
    Notifications,
    Dialog,
    RealmRoleRemover,
  ) => {
    console.log('RealmRolePermissionsCtrl');
    $scope.role = role;
    $scope.realm = realm;

    $scope.remove = () => {
      RealmRoleRemover.remove(
        $scope.role,
        realm,
        Dialog,
        $location,
        Notifications,
      );
    };

    RoleManagementPermissions.get(
      { realm: realm.realm, role: role.id },
      (data) => {
        $scope.permissions = data;
        $scope.$watch(
          'permissions.enabled',
          (newVal, oldVal) => {
            if (newVal !== oldVal) {
              var param = { enabled: $scope.permissions.enabled };
              $scope.permissions = RoleManagementPermissions.update(
                { realm: realm.realm, role: role.id },
                param,
              );
            }
          },
          true,
        );
      },
    );
    Client.query(
      { realm: realm.realm, clientId: getManageClientId(realm) },
      (data) => {
        $scope.realmManagementClientId = data[0].id;
      },
    );
  },
);
module.controller(
  'ClientRolePermissionsCtrl',
  (
    $scope,
    _$http,
    _$route,
    _$location,
    realm,
    client,
    role,
    _Client,
    RoleManagementPermissions,
    Client,
    _Notifications,
  ) => {
    console.log('RealmRolePermissionsCtrl');
    $scope.client = client;
    $scope.role = role;
    $scope.realm = realm;
    RoleManagementPermissions.get(
      { realm: realm.realm, role: role.id },
      (data) => {
        $scope.permissions = data;
        $scope.$watch(
          'permissions.enabled',
          (newVal, oldVal) => {
            if (newVal !== oldVal) {
              var param = { enabled: $scope.permissions.enabled };
              $scope.permissions = RoleManagementPermissions.update(
                { realm: realm.realm, role: role.id },
                param,
              );
            }
          },
          true,
        );
      },
    );
    Client.query(
      { realm: realm.realm, clientId: getManageClientId(realm) },
      (data) => {
        $scope.realmManagementClientId = data[0].id;
      },
    );
  },
);

module.controller(
  'UsersPermissionsCtrl',
  (
    $scope,
    _$http,
    _$route,
    _$location,
    realm,
    UsersManagementPermissions,
    Client,
    _Notifications,
  ) => {
    console.log('UsersPermissionsCtrl');
    $scope.realm = realm;
    var _first = true;
    UsersManagementPermissions.get({ realm: realm.realm }, (data) => {
      $scope.permissions = data;
      $scope.$watch(
        'permissions.enabled',
        (newVal, oldVal) => {
          if (newVal !== oldVal) {
            var param = { enabled: $scope.permissions.enabled };
            $scope.permissions = UsersManagementPermissions.update(
              { realm: realm.realm },
              param,
            );
          }
        },
        true,
      );
    });
    Client.query(
      { realm: realm.realm, clientId: getManageClientId(realm) },
      (data) => {
        $scope.realmManagementClientId = data[0].id;
      },
    );
  },
);

module.controller(
  'ClientPermissionsCtrl',
  (
    $scope,
    _$http,
    _$route,
    _$location,
    realm,
    client,
    Client,
    ClientManagementPermissions,
    _Notifications,
  ) => {
    $scope.client = client;
    $scope.realm = realm;
    ClientManagementPermissions.get(
      { realm: realm.realm, client: client.id },
      (data) => {
        $scope.permissions = data;
        $scope.$watch(
          'permissions.enabled',
          (newVal, oldVal) => {
            if (newVal !== oldVal) {
              var param = { enabled: $scope.permissions.enabled };
              $scope.permissions = ClientManagementPermissions.update(
                { realm: realm.realm, client: client.id },
                param,
              );
            }
          },
          true,
        );
      },
    );
    Client.query(
      { realm: realm.realm, clientId: getManageClientId(realm) },
      (data) => {
        $scope.realmManagementClientId = data[0].id;
      },
    );
  },
);

module.controller(
  'IdentityProviderPermissionCtrl',
  (
    $scope,
    _$http,
    _$route,
    _$location,
    realm,
    identityProvider,
    Client,
    IdentityProviderManagementPermissions,
    _Notifications,
  ) => {
    $scope.identityProvider = identityProvider;
    $scope.realm = realm;
    IdentityProviderManagementPermissions.get(
      { realm: realm.realm, alias: identityProvider.alias },
      (data) => {
        $scope.permissions = data;
        $scope.$watch(
          'permissions.enabled',
          (newVal, oldVal) => {
            if (newVal !== oldVal) {
              var param = { enabled: $scope.permissions.enabled };
              $scope.permissions = IdentityProviderManagementPermissions.update(
                { realm: realm.realm, alias: identityProvider.alias },
                param,
              );
            }
          },
          true,
        );
      },
    );
    Client.query(
      { realm: realm.realm, clientId: getManageClientId(realm) },
      (data) => {
        $scope.realmManagementClientId = data[0].id;
      },
    );
  },
);

module.controller(
  'GroupPermissionsCtrl',
  (
    $scope,
    _$http,
    _$route,
    _$location,
    realm,
    group,
    GroupManagementPermissions,
    Client,
    _Notifications,
  ) => {
    $scope.group = group;
    $scope.realm = realm;
    Client.query(
      { realm: realm.realm, clientId: getManageClientId(realm) },
      (data) => {
        $scope.realmManagementClientId = data[0].id;
      },
    );
    GroupManagementPermissions.get(
      { realm: realm.realm, group: group.id },
      (data) => {
        $scope.permissions = data;
        $scope.$watch(
          'permissions.enabled',
          (newVal, oldVal) => {
            if (newVal !== oldVal) {
              var param = { enabled: $scope.permissions.enabled };
              $scope.permissions = GroupManagementPermissions.update(
                { realm: realm.realm, group: group.id },
                param,
              );
            }
          },
          true,
        );
      },
    );
  },
);
