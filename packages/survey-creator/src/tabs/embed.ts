import * as ko from "knockout";
import * as Survey from "survey-knockout";
import { SurveyJSON5 } from "../json5";
import { editorLocalization } from "../editorLocalization";
import { SurveyCreator } from "../editor";

import "./embed.scss";
var templateHtml = require("./embed.html");

export class SurveyEmbedingWindow {
  private jsonValue: any;
  private surveyEmbedingHead: AceAjax.Editor;
  private surveyEmbedingJava: AceAjax.Editor;
  private surveyEmbedingBody: AceAjax.Editor;
  koHeadText: any;
  koBodyText: any;
  koJavaText: any;
  public surveyId: string = null;
  public surveyPostId: string = null;
  public generateValidJSON: boolean = false;
  public surveyJSVersion: string = Survey.Version;
  public surveyCDNPath: string = "https://unpkg.com";
  koShowAsWindow: any;
  koThemeName: any;
  koHasIds: any;
  koLoadSurvey: any;
  koLibraryVersion: any;
  koVisibleHtml: any;
  private platformCompleteCode = {
    angular: "        survey.onComplete.add(sendDataToServer);\n",
    jquery: "\n    onComplete: sendDataToServer",
    knockout: "\nsurvey.onComplete.add(sendDataToServer);",
    react: " onComplete={ sendDataToServer }",
    vue: "\nsurvey.onComplete.add(sendDataToServer);",
  };
  private platformJSonPage = {
    angular:
      "@Component({\n  selector: 'ng-app',\n        template: \n        <div id='surveyElement'></div>\",\n})\nexport class AppComponent {\n    ngOnInit() {\n        var survey = new Survey.Model(surveyJSON);\n#complete#       Survey.SurveyNG.render(\"surveyElement\", { model: survey });\n    }\n}",
    jquery:
      'var survey = new Survey.Model(surveyJSON);\n$("#surveyContainer").Survey({\n    model: survey,#complete#\n});',
    knockout:
      'var survey = new Survey.Model(surveyJSON, "surveyContainer");#complete#',
    react:
      'ReactDOM.render(\n    <Survey.Survey json={ surveyJSON }#complete# />, document.getElementById("surveyContainer"));',
    vue:
      "var survey = new Survey.Model(surveyJSON);#complete#\nnew Vue({ el: '#surveyContainer', data: { survey: survey } });",
  };
  private platformJSonWindow = {
    angular:
      "@Component({\n  selector: 'ng-app',\n        template: \n        <div id='surveyElement'></div>\",\n})\nexport class AppComponent {\n    ngOnInit() {\n        var survey = new Survey.Model(surveyJSON);#complete#\n       Survey.SurveyWindowNG.render(\"surveyElement\", { model: survey });\n    }\n}",
    jquery:
      'var survey = new Survey.Model(surveyJSON);\n$("#surveyContainer").SurveyWindow({\n    model: survey,#complete#\n});',
    knockout:
      "var survey = new Survey.Model(surveyJSON);\nsurveyWindow.show();#complete#",
    react:
      'ReactDOM.render(\n    <Survey.SurveyWindow json={ surveyJSON } #complete# />, document.getElementById("surveyContainer"));',
    vue: "",
  };
  private platformHtmlonPage = {
    angular: "<ng-app></ng-app>",
    jquery: '<div id="surveyContainer"></div>',
    knockout: '<div id="surveyContainer"></div>',
    react: '<div id="surveyContainer"></div>',
    vue: '<div id="surveyContainer"><survey :survey="survey"></survey></div>',
  };
  private platformHtmlonWindow = {
    angular: "<ng-app></ng-app>",
    jquery: '<div id="surveyContainer"></div>',
    knockout: "",
    react: '<div id="surveyContainer"></div>',
    vue:
      "<div id='surveyContainer'><survey-window :survey='survey'></survey-window></div>",
  };
  constructor() {
    var self = this;
    this.koLibraryVersion = ko.observable("jquery");
    this.koShowAsWindow = ko.observable("page");
    this.koThemeName = ko.observable("modern");
    this.koHasIds = ko.observable(false);
    this.koLoadSurvey = ko.observable(false);

    this.koHeadText = ko.observable("");
    this.koJavaText = ko.observable("");
    this.koBodyText = ko.observable("");

    this.koVisibleHtml = ko.computed(function () {
      return (
        self.koShowAsWindow() == "page" ||
        self.platformHtmlonWindow[self.koLibraryVersion()] != ""
      );
    });
    this.koLibraryVersion.subscribe(function (newValue) {
      self.setHeadText();
      self.setJavaTest();
      self.setBodyText();
    });
    this.koShowAsWindow.subscribe(function (newValue) {
      self.setJavaTest();
      self.setBodyText();
    });
    this.koThemeName.subscribe(function (newValue) {
      self.setHeadText();
      self.setJavaTest();
    });
    this.koLoadSurvey.subscribe(function (newValue) {
      self.setJavaTest();
    });
    this.surveyEmbedingHead = null;
  }
  public getLocString(name: string) {
    return editorLocalization.getString(name);
  }
  public get json(): any {
    return this.jsonValue;
  }
  public set json(value: any) {
    this.jsonValue = value;
  }
  public get hasAceEditor(): boolean {
    return typeof ace !== "undefined";
  }
  public show() {
    if (this.hasAceEditor && this.surveyEmbedingHead == null) {
      this.surveyEmbedingHead = this.createEditor("surveyEmbedingHead");
      this.surveyEmbedingBody = this.createEditor("surveyEmbedingBody");
      this.surveyEmbedingJava = this.createEditor("surveyEmbedingJava");
    }
    this.koHasIds(this.surveyId && this.surveyPostId);
    this.setBodyText();
    this.setHeadText();
    this.setJavaTest();
  }
  private setBodyText() {
    this.setTextToEditor(
      this.surveyEmbedingBody,
      this.koBodyText,
      this.platformHtmlonPage[this.koLibraryVersion()]
    );
  }
  private setHeadText() {
    var platform = this.koLibraryVersion();
    var platformFileName;
    var cssFileName = this.koThemeName() == "modern" ? "modern" : "survey";
    var surveyJSVersion = this.surveyJSVersion;
    var cdnPath = `${this.surveyCDNPath}/survey-${platform}@${surveyJSVersion}`;

    var headText =
      "<!-- Your platform (" + this.koLibraryVersion() + ") scripts. -->\n";
    if (this.koThemeName() != "bootstrap") {
      headText += `\n<link href="${cdnPath}/${cssFileName}.css" type="text/css" rel="stylesheet" />`;
    }

    if (platform === "knockout") {
      platformFileName = "ko";
    } else {
      platformFileName = platform;
    }

    headText += `\n<script src="${cdnPath}/survey.${platformFileName}.min.js"></script>`;
    this.setTextToEditor(this.surveyEmbedingHead, this.koHeadText, headText);
  }
  private setJavaTest() {
    this.setTextToEditor(
      this.surveyEmbedingJava,
      this.koJavaText,
      this.getJavaText()
    );
  }
  private createEditor(elementName: string): AceAjax.Editor {
    var editor = ace.edit(elementName);
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/json");
    editor.setShowPrintMargin(false);
    editor.renderer.setShowGutter(false);
    editor.setReadOnly(true);
    return editor;
  }
  private getJavaText(): string {
    var isOnPage = this.koShowAsWindow() == "page";
    var str = !this.koLoadSurvey() ? this.getSaveFunc() + "\n\n" : "";
    var strCode = isOnPage
      ? this.platformJSonPage[this.koLibraryVersion()]
      : this.platformJSonWindow[this.koLibraryVersion()];
    var replacedCompleteCode = !this.koLoadSurvey()
      ? this.platformCompleteCode[this.koLibraryVersion()]
      : "";
    strCode = strCode.replace("#complete#", replacedCompleteCode);
    str += strCode;
    var jsonText = "var surveyJSON = " + this.getJsonText() + "\n\n";
    return this.getSetCss() + "\n" + jsonText + str;
  }
  private getSetCss(): string {
    return 'Survey.StylesManager.applyTheme("' + this.koThemeName() + '");\n';
  }
  private getSaveFunc() {
    return (
      "function sendDataToServer(survey) {\n" + this.getSaveFuncCode() + "\n}"
    );
  }
  private getSaveFuncCode() {
    if (this.koHasIds())
      return "    survey.sendResult('" + this.surveyPostId + "');";
    return '    //send Ajax request to your web server.\n    alert("The results are:" + JSON.stringify(survey.data));';
  }
  private getJsonText(): string {
    if (this.koLoadSurvey()) {
      return (
        "{ surveyId: '" +
        this.surveyId +
        "', surveyPostId: '" +
        this.surveyPostId +
        "'}"
      );
    }
    if (this.generateValidJSON) return JSON.stringify(this.json);
    return new SurveyJSON5().stringify(this.json);
  }
  private setTextToEditor(editor: AceAjax.Editor, koText: any, text: string) {
    if (editor) editor.setValue(text);
    if (koText) koText(text);
  }
  dispose() {}
}

ko.components.register("survey-embed", {
  viewModel: {
    createViewModel: (params, componentInfo) => {
      var creator: SurveyCreator = params.creator;
      var model = new SurveyEmbedingWindow();

      var subscrViewType = creator.koViewType.subscribe((viewType) => {
        if (viewType === "embed") {
          var json = creator.getSurveyJSON();
          model.json = json;
          model.surveyId = creator.surveyId;
          model.surveyPostId = creator.surveyPostId;
          model.generateValidJSON = creator.getOptions().generateValidJSON;
          model.show();
        }
      });

      ko.utils.domNodeDisposal.addDisposeCallback(componentInfo.element, () => {
        subscrViewType.dispose();
        model.dispose();
      });

      return model;
    },
  },
  template: templateHtml,
});
