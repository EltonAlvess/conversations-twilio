import React from "react";
import { Badge, Layout, Typography } from "antd";
import {SmileOutlined} from "@ant-design/icons"

import "../../assets/Conversation.css";
import "../../assets/ConversationSection.css";
import { ReactComponent as Logo } from "../../assets/chat-svgrepo-com.svg";

import Conversation from "./Conversation";
import LoginPage from "../../LoginPage";
import { ConversationsList } from "./ConversationsList";
import { HeaderItem } from "../../HeaderItem";
import { Client } from '@twilio/conversations';
import API from "../Services/Api";

const { Content, Sider, Header } = Layout;
const { Text } = Typography;

class ConversationsApp extends React.Component {
  constructor(props) {
    super(props);

    const name = localStorage.getItem("name") || "";
    const loggedIn = name !== "";

    this.state = {
      name,
      loggedIn,
      token: null,
      statusString: null,
      conversationsReady: false,
      conversations: [],
      selectedConversationSid: null,
      newMessage: ""
    };
  }

  componentDidMount = () => {
    if (this.state.loggedIn) {
      this.setState({ statusString: "Fetching credentials…" });
      this.setState({ token: this.getToken(this.state.name) });
    };
  }

  logIn = (name) => {
    if (name !== "") {
      localStorage.setItem("name", name);
      this.setState({ name, loggedIn: true, token: this.getToken(name) });
    }
  };

  logOut = (event) => {
    if (event) {
      event.preventDefault();
    }

    this.setState({
      name: "",
      loggedIn: false,
      token: "",
      conversationsReady: false,
      messages: [],
      newMessage: "",
      conversations: []
    });

    localStorage.removeItem("name");
    this.conversationsClient.shutdown().then(() => {
      this.setState({ statusString: "Disconnected" });
    });
  };

  async getToken(identity) {
    const token = await (await API.getToken(identity)).data.token;
    this.setState({ ...this.state, token }, this.initConversations);
  };

  initConversations = async () => {
    window.conversationsClient = Client;
    this.conversationsClient = new Client(this.state.token);

    this.setState({ statusString: "Connecting to Twilio…" });

    this.conversationsClient.on('connectionStateChanged', (state) => {
      this.setState({ statusString: "Client Initialized!" });

      if (state === "connecting")
        this.setState({
          statusString: "Connecting to Twilio…",
          status: "default"
        });
      if (state === "connected") {
        this.setState({
          statusString: `Hello ${this.state.name} You are connected!`,
          status: "success"
        });
      }
      if (state === "disconnecting")
        this.setState({
          statusString: "Disconnecting from Twilio…",
          conversationsReady: false,
          status: "default"
        });
      if (state === "disconnected")
        this.setState({
          statusString: "Disconnected.",
          conversationsReady: false,
          status: "warning"
        });
      if (state === "denied")
        this.setState({
          statusString: "Failed to connect. refresh token and try again.",
          conversationsReady: false,
          status: "error"
        });
    });

    await this.getConversations();
  }

  async getConversations() {
    let users = {};

    await this.conversationsClient
      .getSubscribedConversations()
      .then(result => {
        const conversations = result?.items;
        this.setState({ ...this.state, conversations: conversations });

        conversations
          .forEach(conversation => {
            conversation.getParticipants()
              .then(participants => {
                participants.forEach(participant => {
                  this.getUserProperties(participant, conversation.sid).then(user => {
                    users[user.identity] = user;
                  });
                });
              });
          });
      }).catch(error => {
        console.error(error);
      })

    console.log(users);
  }

  async getUserProperties(participant, room) {
    let result = await participant.getUser().then(user => {
      return ({ friendlyName: user.friendlyName, identity: user.identity, chatRoom: room });
    });
    return result;
  }

  render() {
    const { conversations, selectedConversationSid, status } = this.state;
    const selectedConversation = conversations.find(
      (it) => it.sid === selectedConversationSid
    );

    let conversationContent;

    if (selectedConversation) {
      conversationContent = (
        <Conversation
          conversationProxy={selectedConversation}
          myIdentity={this.state.name}
        />
      );
    } else if (status !== "success") {
      conversationContent = "Loading your conversation!";
    } else {
      conversationContent = "";
    }

    if (this.state.loggedIn) {
      return (
        <div className="conversations-window-wrapper">
          <Layout className="conversations-window-container">
            <Header
              style={{ display: "flex", alignItems: "center", padding: 0 }}
            >
              <div
                style={{
                  maxWidth: "250px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <HeaderItem style={{ paddingRight: "0", display: "flex" }}>
                  <Logo />
                </HeaderItem>
                <HeaderItem>
                  <Text strong style={{ color: "white" }}>
                    Twilio Chat
                  </Text>
                </HeaderItem>
              </div>
              <div style={{ display: "flex", width: "100%" }}>
                <HeaderItem>
                  <Text strong style={{ color: "white" }}>
                    {selectedConversation &&
                      (selectedConversation.friendlyName || selectedConversation.sid)}
                  </Text>
                </HeaderItem>
                <HeaderItem style={{ float: "right", marginLeft: "auto" }}>
                  <span
                    style={{ color: "white" }}
                  >{` ${this.state.statusString}`}</span>
                  <Badge
                    dot={true}
                    status={this.state.status}
                    style={{ marginLeft: "1em" }}
                  />
                </HeaderItem>
                <HeaderItem>
                  <SmileOutlined
                    type="poweroff"
                    onClick={this.logOut}
                    style={{
                      color: "white",
                      fontSize: "20px",
                      marginLeft: "auto"
                    }}
                  />
                </HeaderItem>
              </div>
            </Header>
            <Layout>
              <Sider theme={"light"} width={250}>
                <ConversationsList
                  conversations={conversations}
                  selectedConversationSid={selectedConversationSid}
                  onConversationClick={(item) => {
                    this.setState({ selectedConversationSid: item.sid });
                  }}
                />
              </Sider>
              <Content className="conversation-section">
                <div id="SelectedConversation">{conversationContent}</div>
              </Content>
            </Layout>
          </Layout>
        </div>
      );
    }

    return <LoginPage onSubmit={this.logIn} />;
  }
}

export default ConversationsApp;
