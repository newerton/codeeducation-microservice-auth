module.controller(
  'GroupListCtrl',
  (
    $scope,
    $route,
    $q,
    realm,
    Groups,
    GroupsCount,
    Group,
    GroupChildren,
    Notifications,
    $location,
    Dialog,
    ComponentUtils,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.groupList = [
      {
        id: 'realm',
        name: $translate.instant('groups'),
        subGroups: [],
      },
    ];

    $scope.searchCriteria = '';
    $scope.currentPage = 1;
    $scope.currentPageInput = $scope.currentPage;
    $scope.pageSize = 20;
    $scope.numberOfPages = 1;
    $scope.tree = [];

    var refreshGroups = (search) => {
      console.log('refreshGroups');
      $scope.currentPageInput = $scope.currentPage;

      var first = $scope.currentPage * $scope.pageSize - $scope.pageSize;
      console.log(`first:${first}`);
      var queryParams = {
        realm: realm.realm,
        first: first,
        max: $scope.pageSize,
      };
      var countParams = {
        realm: realm.realm,
        top: 'true',
      };

      if (angular.isDefined(search) && search !== '') {
        queryParams.search = search;
        countParams.search = search;
      }

      var promiseGetGroups = $q.defer();
      Groups.query(
        queryParams,
        (entry) => {
          promiseGetGroups.resolve(entry);
        },
        () => {
          promiseGetGroups.reject(
            $translate.instant('group.fetch.fail', { params: queryParams }),
          );
        },
      );
      promiseGetGroups.promise.then(
        (groups) => {
          $scope.groupList = [
            {
              id: 'realm',
              name: $translate.instant('groups'),
              subGroups: ComponentUtils.sortGroups('name', groups),
            },
          ];
          if (angular.isDefined(search) && search !== '') {
            // Add highlight for concrete text match
            setTimeout(() => {
              document.querySelectorAll('span').forEach((element) => {
                if (element.textContent.indexOf(search) !== -1) {
                  angular.element(element).addClass('highlight');
                }
              });
            }, 500);
          }
        },
        (failed) => {
          Notifications.error(failed);
        },
      );

      var promiseCount = $q.defer();
      console.log(`countParams: realm[${countParams.realm}`);
      GroupsCount.query(
        countParams,
        (entry) => {
          promiseCount.resolve(entry);
        },
        () => {
          promiseCount.reject(
            $translate.instant('group.fetch.fail', { params: countParams }),
          );
        },
      );
      promiseCount.promise.then(
        (entry) => {
          if (angular.isDefined(entry.count) && entry.count > $scope.pageSize) {
            $scope.numberOfPages = Math.ceil(entry.count / $scope.pageSize);
          } else {
            $scope.numberOfPages = 1;
          }
        },
        (failed) => {
          Notifications.error(failed);
        },
      );
    };
    refreshGroups();

    $scope.$watch('currentPage', (newValue, oldValue) => {
      if (parseInt(newValue, 10) !== oldValue) {
        refreshGroups($scope.searchCriteria);
      }
    });

    $scope.clearSearch = () => {
      $scope.searchCriteria = '';
      if (parseInt($scope.currentPage, 10) === 1) {
        refreshGroups();
      } else {
        $scope.currentPage = 1;
      }
    };

    $scope.searchGroup = () => {
      if (parseInt($scope.currentPage, 10) === 1) {
        refreshGroups($scope.searchCriteria);
      } else {
        $scope.currentPage = 1;
      }
    };

    $scope.edit = (selected) => {
      if (selected.id === 'realm') return;
      $location.url(`/realms/${realm.realm}/groups/${selected.id}`);
    };

    $scope.cut = (selected) => {
      $scope.cutNode = selected;
    };

    $scope.isDisabled = () => {
      if (!$scope.tree.currentNode) return true;
      return $scope.tree.currentNode.id === 'realm';
    };

    $scope.paste = (selected) => {
      if (selected === null) return;
      if ($scope.cutNode === null) return;
      if (selected.id === $scope.cutNode.id) return;
      if (selected.id === 'realm') {
        Groups.save({ realm: realm.realm }, { id: $scope.cutNode.id }, () => {
          $route.reload();
          Notifications.success($translate.instant('group.move.success'));
        });
      } else {
        GroupChildren.save(
          { realm: realm.realm, groupId: selected.id },
          { id: $scope.cutNode.id },
          () => {
            $route.reload();
            Notifications.success($translate.instant('group.move.success'));
          },
        );
      }
    };

    $scope.remove = (selected) => {
      if (selected === null) return;
      Dialog.confirmWithButtonText(
        $translate.instant('group.remove.confirm.title', {
          name: selected.name,
        }),
        $translate.instant('group.remove.confirm.message', {
          name: selected.name,
        }),
        $translate.instant('dialogs.delete.confirm'),
        () => {
          Group.remove({ realm: realm.realm, groupId: selected.id }, () => {
            $route.reload();
            Notifications.success($translate.instant('group.remove.success'));
          });
        },
      );
    };

    $scope.createGroup = (selected) => {
      var parent = 'realm';
      if (selected) {
        parent = selected.id;
      }
      $location.url(`/create/group/${realm.realm}/parent/${parent}`);
    };
    var isLeaf = (node) =>
      node.id !== 'realm' && (!node.subGroups || node.subGroups.length === 0);

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
  },
);

module.controller(
  'GroupCreateCtrl',
  (
    $scope,
    _$route,
    realm,
    parentId,
    Groups,
    _Group,
    GroupChildren,
    Notifications,
    $location,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.group = {};
    $scope.save = () => {
      console.log('save!!!');
      if (parentId === 'realm') {
        console.log('realm');
        Groups.save({ realm: realm.realm }, $scope.group, (_data, headers) => {
          var l = headers().location;

          var id = l.substring(l.lastIndexOf('/') + 1);

          $location.url(`/realms/${realm.realm}/groups/${id}`);
          Notifications.success($translate.instant('group.create.success'));
        });
      } else {
        GroupChildren.save(
          { realm: realm.realm, groupId: parentId },
          $scope.group,
          (_data, headers) => {
            var l = headers().location;

            var id = l.substring(l.lastIndexOf('/') + 1);

            $location.url(`/realms/${realm.realm}/groups/${id}`);
            Notifications.success($translate.instant('group.create.success'));
          },
        );
      }
    };
    $scope.cancel = () => {
      $location.url(`/realms/${realm.realm}/groups`);
    };
  },
);

module.controller(
  'GroupTabCtrl',
  (Dialog, $scope, Current, Group, Notifications, $location, $translate) => {
    $scope.removeGroup = () => {
      Dialog.confirmWithButtonText(
        $translate.instant('group.remove.confirm.title', {
          name: $scope.group.name,
        }),
        $translate.instant('group.remove.confirm.message', {
          name: $scope.group.name,
        }),
        $translate.instant('dialogs.delete.confirm'),
        () => {
          Group.remove(
            {
              realm: Current.realm.realm,
              groupId: $scope.group.id,
            },
            () => {
              $location.url(`/realms/${Current.realm.realm}/groups`);
              Notifications.success($translate.instant('group.remove.success'));
            },
          );
        },
      );
    };
  },
);

module.controller(
  'GroupDetailCtrl',
  (
    _Dialog,
    $scope,
    realm,
    group,
    Group,
    Notifications,
    $location,
    $translate,
  ) => {
    $scope.realm = realm;

    if (!group.attributes) {
      group.attributes = {};
    }
    convertAttributeValuesToString(group);

    $scope.group = angular.copy(group);

    $scope.changed = false; // $scope.create;
    $scope.$watch(
      'group',
      () => {
        if (!angular.equals($scope.group, group)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      convertAttributeValuesToLists();

      Group.update(
        {
          realm: realm.realm,
          groupId: $scope.group.id,
        },
        $scope.group,
        () => {
          $scope.changed = false;
          convertAttributeValuesToString($scope.group);
          group = angular.copy($scope.group);
          Notifications.success($translate.instant('group.edit.success'));
        },
      );
    };

    function convertAttributeValuesToLists() {
      var attrs = $scope.group.attributes;
      for (var attribute in attrs) {
        if (typeof attrs[attribute] === 'string') {
          attrs[attribute] = attrs[attribute].split('##');
        }
      }
    }

    function convertAttributeValuesToString(group) {
      var attrs = group.attributes;
      for (var attribute in attrs) {
        if (typeof attrs[attribute] === 'object') {
          attrs[attribute] = attrs[attribute].join('##');
        }
      }
    }

    $scope.reset = () => {
      $scope.group = angular.copy(group);
      $scope.changed = false;
    };

    $scope.cancel = () => {
      $location.url(`/realms/${realm.realm}/groups`);
    };

    $scope.addAttribute = () => {
      $scope.group.attributes[$scope.newAttribute.key] =
        $scope.newAttribute.value;
      delete $scope.newAttribute;
    };

    $scope.removeAttribute = (key) => {
      delete $scope.group.attributes[key];
    };
  },
);

module.controller(
  'GroupRoleMappingCtrl',
  (
    $scope,
    $http,
    $route,
    realm,
    group,
    clients,
    client,
    Client,
    Notifications,
    GroupRealmRoleMapping,
    GroupClientRoleMapping,
    GroupAvailableRealmRoleMapping,
    GroupAvailableClientRoleMapping,
    GroupCompositeRealmRoleMapping,
    GroupCompositeClientRoleMapping,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.group = group;
    $scope.selectedRealmRoles = [];
    $scope.selectedRealmMappings = [];
    $scope.realmMappings = [];
    $scope.clients = clients;
    $scope.client = client;
    $scope.clientRoles = [];
    $scope.clientComposite = [];
    $scope.selectedClientRoles = [];
    $scope.selectedClientMappings = [];
    $scope.clientMappings = [];
    $scope.dummymodel = [];

    $scope.realmMappings = GroupRealmRoleMapping.query({
      realm: realm.realm,
      groupId: group.id,
    });
    $scope.realmRoles = GroupAvailableRealmRoleMapping.query({
      realm: realm.realm,
      groupId: group.id,
    });
    $scope.realmComposite = GroupCompositeRealmRoleMapping.query({
      realm: realm.realm,
      groupId: group.id,
    });

    $scope.addRealmRole = () => {
      $scope.selectedRealmRolesToAdd = JSON.parse(
        `[${$scope.selectedRealmRoles}]`,
      );
      $scope.selectedRealmRoles = [];
      $http
        .post(
          `${authUrl}/admin/realms/${realm.realm}/groups/${group.id}/role-mappings/realm`,
          $scope.selectedRealmRolesToAdd,
        )
        .then(() => {
          $scope.realmMappings = GroupRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.realmRoles = GroupAvailableRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.realmComposite = GroupCompositeRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.selectedRealmMappings = [];
          $scope.selectRealmRoles = [];
          if ($scope.selectedClient) {
            console.log('load available');
            $scope.clientComposite = GroupCompositeClientRoleMapping.query({
              realm: realm.realm,
              groupId: group.id,
              client: $scope.selectedClient.id,
            });
            $scope.clientRoles = GroupAvailableClientRoleMapping.query({
              realm: realm.realm,
              groupId: group.id,
              client: $scope.selectedClient.id,
            });
            $scope.clientMappings = GroupClientRoleMapping.query({
              realm: realm.realm,
              groupId: group.id,
              client: $scope.selectedClient.id,
            });
            $scope.selectedClientRoles = [];
            $scope.selectedClientMappings = [];
          }
          $scope.selectedRealmRolesToAdd = [];
          Notifications.success($translate.instant('group.roles.add.success'));
        });
    };

    $scope.deleteRealmRole = () => {
      $scope.selectedRealmMappingsToRemove = JSON.parse(
        `[${$scope.selectedRealmMappings}]`,
      );
      $http
        .delete(
          `${authUrl}/admin/realms/${realm.realm}/groups/${group.id}/role-mappings/realm`,
          {
            data: $scope.selectedRealmMappingsToRemove,
            headers: { 'content-type': 'application/json' },
          },
        )
        .then(() => {
          $scope.realmMappings = GroupRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.realmRoles = GroupAvailableRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.realmComposite = GroupCompositeRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.selectedRealmMappings = [];
          $scope.selectRealmRoles = [];
          if ($scope.selectedClient) {
            console.log('load available');
            $scope.clientComposite = GroupCompositeClientRoleMapping.query({
              realm: realm.realm,
              groupId: group.id,
              client: $scope.selectedClient.id,
            });
            $scope.clientRoles = GroupAvailableClientRoleMapping.query({
              realm: realm.realm,
              groupId: group.id,
              client: $scope.selectedClient.id,
            });
            $scope.clientMappings = GroupClientRoleMapping.query({
              realm: realm.realm,
              groupId: group.id,
              client: $scope.selectedClient.id,
            });
            $scope.selectedClientRoles = [];
            $scope.selectedClientMappings = [];
          }
          $scope.selectedRealmMappingsToRemove = [];
          Notifications.success(
            $translate.instant('group.roles.remove.success'),
          );
        });
    };

    $scope.addClientRole = () => {
      $scope.selectedClientRolesToAdd = JSON.parse(
        `[${$scope.selectedClientRoles}]`,
      );
      $http
        .post(
          `${authUrl}/admin/realms/${realm.realm}/groups/${group.id}/role-mappings/clients/${$scope.selectedClient.id}`,
          $scope.selectedClientRolesToAdd,
        )
        .then(() => {
          $scope.clientMappings = GroupClientRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
            client: $scope.selectedClient.id,
          });
          $scope.clientRoles = GroupAvailableClientRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
            client: $scope.selectedClient.id,
          });
          $scope.clientComposite = GroupCompositeClientRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
            client: $scope.selectedClient.id,
          });
          $scope.selectedClientRoles = [];
          $scope.selectedClientMappings = [];
          $scope.realmComposite = GroupCompositeRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.realmRoles = GroupAvailableRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.selectedClientRolesToAdd = [];
          Notifications.success($translate.instant('group.roles.add.success'));
        });
    };

    $scope.deleteClientRole = () => {
      $scope.selectedClientMappingsToRemove = JSON.parse(
        `[${$scope.selectedClientMappings}]`,
      );
      $http
        .delete(
          `${authUrl}/admin/realms/${realm.realm}/groups/${group.id}/role-mappings/clients/${$scope.selectedClient.id}`,
          {
            data: $scope.selectedClientMappingsToRemove,
            headers: { 'content-type': 'application/json' },
          },
        )
        .then(() => {
          $scope.clientMappings = GroupClientRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
            client: $scope.selectedClient.id,
          });
          $scope.clientRoles = GroupAvailableClientRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
            client: $scope.selectedClient.id,
          });
          $scope.clientComposite = GroupCompositeClientRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
            client: $scope.selectedClient.id,
          });
          $scope.selectedClientRoles = [];
          $scope.selectedClientMappings = [];
          $scope.realmComposite = GroupCompositeRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.realmRoles = GroupAvailableRealmRoleMapping.query({
            realm: realm.realm,
            groupId: group.id,
          });
          $scope.selectedClientMappingsToRemove = [];
          Notifications.success(
            $translate.instant('group.roles.remove.success'),
          );
        });
    };

    $scope.changeClient = (client) => {
      $scope.selectedClient = client;
      if (!client?.id) {
        $scope.selectedClient = null;
        $scope.clientRoles = null;
        $scope.clientMappings = null;
        $scope.clientComposite = null;
        return;
      }
      if ($scope.selectedClient) {
        $scope.clientComposite = GroupCompositeClientRoleMapping.query({
          realm: realm.realm,
          groupId: group.id,
          client: $scope.selectedClient.id,
        });
        $scope.clientRoles = GroupAvailableClientRoleMapping.query({
          realm: realm.realm,
          groupId: group.id,
          client: $scope.selectedClient.id,
        });
        $scope.clientMappings = GroupClientRoleMapping.query({
          realm: realm.realm,
          groupId: group.id,
          client: $scope.selectedClient.id,
        });
      }
      $scope.selectedClientRoles = [];
      $scope.selectedClientMappings = [];
    };

    clientSelectControl($scope, $route.current.params.realm, Client);
  },
);

module.controller(
  'GroupMembersCtrl',
  ($scope, realm, group, GroupMembership) => {
    $scope.realm = realm;
    $scope.page = 0;
    $scope.group = group;

    $scope.query = {
      realm: realm.realm,
      groupId: group.id,
      max: 5,
      first: 0,
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
      console.log(`query.search: ${$scope.query.search}`);
      $scope.searchLoaded = false;

      $scope.users = GroupMembership.query($scope.query, () => {
        console.log('search loaded');
        $scope.searchLoaded = true;
        $scope.lastSearch = $scope.query.search;
      });
    };

    $scope.searchQuery();
  },
);

module.controller(
  'DefaultGroupsCtrl',
  (
    $scope,
    $q,
    realm,
    Groups,
    GroupsCount,
    DefaultGroups,
    Notifications,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.groupList = [];
    $scope.selectedGroup = null;
    $scope.tree = [];

    $scope.searchCriteria = '';
    $scope.currentPage = 1;
    $scope.currentPageInput = $scope.currentPage;
    $scope.pageSize = 20;
    $scope.numberOfPages = 1;

    var refreshDefaultGroups = () => {
      DefaultGroups.query({ realm: realm.realm }, (data) => {
        $scope.defaultGroups = data;
      });
    };

    var refreshAvailableGroups = (search) => {
      var first = $scope.currentPage * $scope.pageSize - $scope.pageSize;
      $scope.currentPageInput = $scope.currentPage;
      var queryParams = {
        realm: realm.realm,
        first: first,
        max: $scope.pageSize,
      };
      var countParams = {
        realm: realm.realm,
        top: 'true',
      };

      if (angular.isDefined(search) && search !== '') {
        queryParams.search = search;
        countParams.search = search;
      }

      var promiseGetGroups = $q.defer();
      Groups.query(
        queryParams,
        (entry) => {
          promiseGetGroups.resolve(entry);
        },
        () => {
          promiseGetGroups.reject(
            $translate.instant('group.fetch.fail', { params: queryParams }),
          );
        },
      );
      promiseGetGroups.promise.then(
        (groups) => {
          $scope.groupList = groups;
        },
        (failed) => {
          Notifications.success(failed);
        },
      );

      var promiseCount = $q.defer();
      GroupsCount.query(
        countParams,
        (entry) => {
          promiseCount.resolve(entry);
        },
        () => {
          promiseCount.reject(
            $translate.instant('group.fetch.fail', { params: countParams }),
          );
        },
      );
      promiseCount.promise.then(
        (entry) => {
          if (angular.isDefined(entry.count) && entry.count > $scope.pageSize) {
            $scope.numberOfPages = Math.ceil(entry.count / $scope.pageSize);
          }
        },
        (failed) => {
          Notifications.success(failed);
        },
      );
    };

    refreshAvailableGroups();

    $scope.$watch('currentPage', (newValue, oldValue) => {
      if (parseInt(newValue, 10) !== parseInt(oldValue, 10)) {
        refreshAvailableGroups($scope.searchCriteria);
      }
    });

    $scope.clearSearch = () => {
      $scope.searchCriteria = '';
      if (parseInt($scope.currentPage, 10) === 1) {
        refreshAvailableGroups();
      } else {
        $scope.currentPage = 1;
      }
    };

    $scope.searchGroup = () => {
      if (parseInt($scope.currentPage, 10) === 1) {
        refreshAvailableGroups($scope.searchCriteria);
      } else {
        $scope.currentPage = 1;
      }
    };

    refreshDefaultGroups();

    $scope.addDefaultGroup = () => {
      if (!$scope.tree.currentNode) {
        Notifications.error($translate.instant('group.default.add.error'));
        return;
      }

      DefaultGroups.update(
        { realm: realm.realm, groupId: $scope.tree.currentNode.id },
        () => {
          refreshDefaultGroups();
          Notifications.success(
            $translate.instant('group.default.add.success'),
          );
        },
      );
    };

    $scope.removeDefaultGroup = () => {
      DefaultGroups.remove(
        { realm: realm.realm, groupId: $scope.selectedGroup.id },
        () => {
          refreshDefaultGroups();
          Notifications.success(
            $translate.instant('group.default.remove.success'),
          );
        },
      );
    };

    var isLeaf = (node) =>
      node.id !== 'realm' && (!node.subGroups || node.subGroups.length === 0);

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
  },
);
