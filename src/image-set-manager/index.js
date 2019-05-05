var componentName = 'imageSetManager';
module.exports.name = componentName;
require('./style.less');

var app = angular.module(componentName, [
    'sideBar', 'wiTreeView', 
    'wiToken', 'editable', 'ngclipboard','wiDialog'
]);
app.component(componentName, {
    template: require('./template.html'),
    controller: imageSetManagerController,
    controllerAs: 'self',
    bindings: {
        token: "<",
        idProject: "<",
        baseUrl: "<"
    },
    transclude: true
});

function imageSetManagerController($scope, $http, $timeout, $element, wiToken, wiDialog) {
    let self = this;
    self.treeConfig = [];
    self.selectedNode = null;
    const BASE_URL = "http://dev.i2g.cloud";

    this.$onInit = function () {
        self.baseUrl = self.baseUrl || BASE_URL;
        if (self.token) 
            wiToken.setToken(self.token);
        getTree();
        $element.find('.image-holder').draggable({
            start: function(event, ui) {
                ui.helper[0].focus();
            }
        });
    }
    this.runMatch = function (node, criteria) {
        return node.name.includes(criteria);
    }
    this.getLabel = function (node) {
        if (node.idImageSet) {
            return node.name;
        } else if (node.idWell) {
            return node.name;
        }
    }
    this.getIcon = function (node) {
        if (node.idImage) {
            return 'image-16x16';
        } else if (node.idImageSet)
            return "image-set-16x16"
        else if (node.idWell)
            return "well-16x16";
    }
    this.getChildren = function (node) {
        if (node.idImageSet) {
            return null;
        }
        else {
            return node.imageSets;
        }
    }
    function updateNode(node) {
        if (node.idImageSet && node.idWell) {
            console.log("Clicked on imageSet");
        } else {
            getImageSet(node.idWell, function (err, imageSets) {
                console.log(node.idWell);
                node.imageSets = imageSets;
            });
        }
        
    }
    this.clickFunction = function ($event, node) {
        updateNode(node);
        self.selectedNode = node;
    }
    self.createImageSet = function() {
        wiDialog.promptDialog({
            title: "New Image Set",
            inputName: "name",
            input: 'ImgSet_'
        }, createImageSet);
    }
    function createImageSet(imageSetName) {
        if (!self.selectedNode) return;
        $http({
            method: 'POST',
            url: self.baseUrl + '/project/well/image-set/new',
            data: {
                name: imageSetName,
                idWell: self.selectedNode.idWell
            },
            headers: {
                "Authorization": wiToken.getToken(),
            }
        }).then(function (response) {
            if (response.data.code == 200) {
                let node = self.treeConfig.find((n) => (self.selectedNode.idWell === n.idWell));
                updateNode(node);
            }
            else {
                self.createImageSet();
            }
        }, function (err) {
            console.error(err);
        });

        console.log('Create image set');
    }
    self.deleteImageSet = function() {
        console.log("delete image set");
        if (!self.selectedNode || !self.selectedNode.idImageSet) return;
        wiDialog.confirmDialog("Confirmation", 
            `Are you sure to delete image set "${self.selectedNode.name}"?`, 
            function(yesno) {
                if (yesno) {
                    deleteImageSet(self.selectedNode.idImageSet);
                }
            });
    }
    function deleteImageSet(idImageSet) {
        $http({
            method: 'POST',
            url: self.baseUrl + '/project/well/image-set/delete',
            data: {
                idImageSet:idImageSet
            },
            headers: {
                "Authorization": wiToken.getToken(),
            }
        }).then(function (response) {
            console.log('Success');
            let node = self.treeConfig.find((aNode) => (self.selectedNode.idWell === aNode.idWell));
            updateNode(node);
        }, function (err) {
            self.createImageSet();
        });
    }
    self.importImages = function () {
        console.log("Import images");
    }
    self.exportImageSet = function () {
        console.log("Export image set");
    }
    self.refresh = getTree;

    self.rowClick = function(image) {
        console.log("row click");
        $timeout(() => { self.imgUrl = image.imageUrl; });
    }
    self.keyDown = function($event) {
        if ($event.key === 'Escape') {
            $timeout(() => {
                self.imgUrl = null;
            });
        }
    }
    self.getFocus = function($event) {
        $event.currentTarget.focus();
    }
    function getTree() {
        self.treeConfig = [];
        getWells(self.treeConfig, self.idProject, function (err, wells) {
            if (!err) self.treeConfig = wells;
        });
    }

    function getWells(treeConfig, idProject, cb) {
        $http({
            method: 'POST',
            url: self.baseUrl + '/project/well/list',
            data: {
                idProject: idProject
            },
            headers: {
                "Authorization": wiToken.getToken(),
            }
        }).then(function (response) {
            cb(null, response.data.content, treeConfig);
        }, function (err) {
            cb(err);
        });
    }

    function getImageSet(wellId, cb) {
        $http({
            method: 'POST',
            url: self.baseUrl + '/project/well/image-set/list',
            data: {
                idWell: wellId
            },
            headers: {
                "Authorization": wiToken.getToken(),
            }
        }).then(function (response) {
            cb(null, response.data.content);
        }, function (err) {
            cb(err);
        });
    }
    self.getImages = getImages

    function getImages(imageSet) {
        return (imageSet || {}).images;
    }

    self.addImage = function() {
        self.selectedNode.images = self.selectedNode.images || [];
        self.selectedNode.images.push({
            name: 'newImage',
            topDepth: 0,
            bottomDepth: 100,
            imageUrl: null,
            idImageSet: self.selectedNode.idImageSet
        });
    }
    self.imageSetup = function(image) {
        wiDialog.imageGaleryDialog(function(imgUrl) {
            image.imageUrl = imgUrl;
        });
    }
}
